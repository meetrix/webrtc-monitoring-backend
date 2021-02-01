import { Response, Request, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Handlebars from 'handlebars';
import stringify from 'csv-stringify/lib/sync';

import { Feedback } from '../../../models/Feedback';
import { SESSION_SECRET } from '../../../config/secrets';
import { USER_ROLES } from '../../../config/settings';
import { indexTemplate, feedbacksTemplate } from './templates';
import { signToken } from '../../../util/auth';
import validator from 'validator';
import { User } from '../../../models/User';

const indexView = Handlebars.compile(indexTemplate);
const feedbackView = Handlebars.compile(feedbacksTemplate);
export const index = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.status(200).send(indexView({}));
};

const authenticateAdmin = async (emailRaw: string, password: string): Promise<string | null> => {
  let token: string = null;
  const email = validator.normalizeEmail(emailRaw, {
    // eslint-disable-next-line @typescript-eslint/camelcase
    gmail_remove_dots: false,
  });

  try {
    const user = await User.findOne({ email: email && email.toLowerCase() });
    const authenticated = user && await user.authenticate(password);
    const hasPermissions = USER_ROLES.indexOf(user.role) >= USER_ROLES.indexOf('admin');

    if (authenticated && hasPermissions) {
      token = signToken(user);
    }
  } catch (error) {
    console.log(error);
  }

  return token;
};

export const verifyAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.query.token as string;

  try {
    const user = jwt.verify(token, SESSION_SECRET) as Express.User;

    if (!user || USER_ROLES.indexOf(user.role) < USER_ROLES.indexOf('admin')) {
      res.status(403).send('forbidden');
    }

    next();
  } catch (error) {
    console.log(error);
    res.status(401).send('unauthorized');
  }
};

export const feedbackReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string = null;
  if (req.body.email) {
    token = await authenticateAdmin(req.body.email, req.body.password);
  } else {
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).send('unauthorized');
  }

  const type = req.route.path.endsWith('.csv')
    ? 'csv'
    : req.route.path.endsWith('.json')
      ? 'json'
      : '';
  const { from: fromStr, limit: limitStr, all = null } = req.query;
  const from = Number(fromStr) || 0;
  const limit = Number(limitStr) || Number(req.body.limit) || 100;

  try {
    const feedbacks = all === 'true'
      ? await Feedback.find().sort('-createdAt')
      : await Feedback.find()
        .limit(limit)
        .skip(from)
        .sort('-createdAt');

    const result = feedbacks.map((f) => {
      const { email, rating, feedback, meta, createdAt } = f.format();
      const appVersion = meta?.app?.version;
      const browser = meta?.browser?.name;
      const browserVersion = meta?.browser?.version;
      const os = meta?.os?.name;
      const osVersion = meta?.os?.version;

      return {
        email,
        rating,
        feedback,
        appVersion,
        browser,
        browserVersion,
        os,
        osVersion,
        createdAt: createdAt.toISOString(),
      };
    });

    if (type == 'json') {
      res.status(200).json(result);
    } else if (type == 'csv') {
      res.type('text/csv').status(200).send(stringify(result, { header: true }));
    } else {
      const prev = from - limit < 0 ? null : (from - limit).toString();
      const next = result.length < limit ? null : (from + limit).toString();
      res.status(200).send(feedbackView({ records: result, prev, next, from, limit, token }));
    }
  } catch (error) {
    next(error);
  }
};
