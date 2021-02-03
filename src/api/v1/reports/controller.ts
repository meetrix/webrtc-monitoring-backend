import { Response, Request, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Handlebars from 'handlebars';
import validator from 'validator';
import stringify from 'csv-stringify/lib/sync';

import { Feedback } from '../../../models/Feedback';
import { SESSION_SECRET } from '../../../config/secrets';
import { USER_ROLES } from '../../../config/settings';
import { indexTemplate, feedbacksTemplate } from './templates';
import { signToken } from '../../../util/auth';
import { User } from '../../../models/User';
import { Recording } from '../../../models/Recording';

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
  nextFunc: NextFunction
): Promise<void> => {
  let token: string = null;
  if (req.body.email) {
    token = await authenticateAdmin(req.body.email, req.body.password);
  } else {
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).send('unauthorized');
    return;
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
    nextFunc(error);
  }
};

/**
 * Tries to parse a date string
 * @param date A date in YYYY-MM-DD format
 */
const parseDate = (date: string): Date | null => {
  const matches = date.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (matches.length === 4) {
    // Month is 0-indexed
    return new Date(Number(matches[1]), Number(matches[2]) - 1, Number(matches[3]));
  }

  return null;
};

export const usersReport = async (
  req: Request,
  res: Response,
  nextFunc: NextFunction
): Promise<void> => {
  // let token: string = null;
  // if (req.body.email) {
  //   token = await authenticateAdmin(req.body.email, req.body.password);
  // } else {
  //   token = req.query.token as string;
  // }

  // if (!token) {
  //   res.status(401).send('unauthorized');
  //   return;
  // }

  try {
    const { from, to, minRecordingMinutes } = req.query;
    // Defaults to current date
    const toDate = to && parseDate(to as string) || new Date();
    // Defaults to 30 days before -- auto adjusted
    const fromDate = from && parseDate(from as string)
      || new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() - 30);
    // Defaults to 1 hour, in seconds
    const minDuration = (Number(minRecordingMinutes) ?? 60) * 60;

    const users = await Recording.aggregate()
      .match({ createdAt: { $gte: fromDate, $lt: toDate } })
      .group({
        _id: '$ltid',
        email: { $first: '$email' },
        recordingsCount: { $sum: 1 },
        totalLength: { $sum: '$duration' }
      })
      .match({ totalLength: { $gte: minDuration } })
      .sort('-totalLength')
      .project({
        _id: 1,
        email: 1,
        recordingsCount: 1,
        totalLength: { $divide: ['$totalLength', 60] }
      });

    res.json({ count: users.length, users });
  } catch (error) {
    nextFunc(error);
  }
};
