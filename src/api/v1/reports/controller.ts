import { Response, Request, NextFunction } from 'express';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import Handlebars from 'handlebars';
import validator from 'validator';
import stringify from 'csv-stringify/lib/sync';

import { Feedback } from '../../../models/Feedback';
import { SESSION_SECRET } from '../../../config/secrets';
import { NODE_ENV, PRODUCTION, USER_ROLES } from '../../../config/settings';
import { signToken } from '../../../util/auth';
import { User } from '../../../models/User';
import { Recording } from '../../../models/Recording';
import { getPlanIdByPriceId, stripe } from '../../../util/stripe';
import {
  indexTemplate,
  feedbacksTemplate,
  paymentAlertsTemplate,
} from './templates';
import { Payment } from '../../../models/Payment';
import { getUserReport } from './userReports';
import { getEventReport } from './eventReports';

const indexView = Handlebars.compile(indexTemplate);
const feedbackView = Handlebars.compile(feedbacksTemplate);
const paymentAlertsView = Handlebars.compile(paymentAlertsTemplate);

const COOKIE_MAX_AGE = 1000 * 60 * 60 * 8; // 8 Hours

export const index = async (req: Request, res: Response): Promise<void> => {
  res.status(200).send(indexView({}));
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res
    .status(200)
    .cookie('token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
    })
    .send('Logged out.');
};

const authenticateAdmin = async (
  emailRaw: string,
  password: string
): Promise<string | null> => {
  let token: string = null;
  const email = validator.normalizeEmail(emailRaw, {
    // eslint-disable-next-line @typescript-eslint/camelcase
    gmail_remove_dots: false,
  });

  try {
    const user = await User.findOne({ email: email && email.toLowerCase() });
    const authenticated = user && (await user.authenticate(password));
    const hasPermissions =
      USER_ROLES.indexOf(user.role) >= USER_ROLES.indexOf('admin');

    if (authenticated && hasPermissions) {
      token = signToken(user);
    }
  } catch (error) {
    console.log(error);
  }

  return token;
};

export const verifyAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.cookies.token as string;

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
    token = req.cookies.token as string;
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
    const feedbacks =
      all === 'true'
        ? await Feedback.find().sort('-createdAt')
        : await Feedback.find().limit(limit).skip(from).sort('-createdAt');

    const result = feedbacks.map((f) => {
      const { email, name, rating, feedback, meta, createdAt, useCase } =
        f.format();
      const appVersion = meta?.app?.version;
      const browser = meta?.browser?.name;
      const browserVersion = meta?.browser?.version;
      const os = meta?.os?.name;
      const osVersion = meta?.os?.version;
      const screenResolution = meta?.screen?.resolution;
      const screenAspectRatio = meta?.screen?.aspectRatio;

      return {
        email,
        name,
        rating,
        feedback,
        useCase,
        appVersion,
        browser,
        browserVersion,
        os,
        osVersion,
        screenResolution,
        screenAspectRatio,
        createdAt: createdAt.toISOString(),
      };
    });

    if (type == 'json') {
      res
        .cookie('token', token, {
          httpOnly: true,
          path: '/',
          maxAge: COOKIE_MAX_AGE,
        })
        .json(result);
    } else if (type == 'csv') {
      res
        .type('text/csv')
        .cookie('token', token, {
          httpOnly: true,
          path: '/',
          maxAge: COOKIE_MAX_AGE,
        })
        .send(stringify(result, { header: true }));
    } else {
      const prev = from - limit < 0 ? null : (from - limit).toString();
      const next = result.length < limit ? null : (from + limit).toString();
      res
        .cookie('token', token, {
          httpOnly: true,
          path: '/',
          maxAge: COOKIE_MAX_AGE,
        })
        .send(feedbackView({ records: result, prev, next, from, limit }));
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
  if (matches && matches.length === 4) {
    // Month is 0-indexed
    return new Date(
      Number(matches[1]),
      Number(matches[2]) - 1,
      Number(matches[3])
    );
  }

  return null;
};

export const usageReport = async (
  req: Request,
  res: Response,
  nextFunc: NextFunction
): Promise<void> => {
  let token: string = null;
  if (req.body.email) {
    token = await authenticateAdmin(req.body.email, req.body.password);
  } else {
    token = req.cookies.token as string;
  }

  if (!token) {
    res.status(401).send('unauthorized');
    return;
  }

  try {
    // Support POST (body) as well as GET (query)
    const { from, to, minRecordingMinutes } =
      Object.keys(req.query).length > 0 ? req.query : req.body;
    // Defaults to current date
    const toDate = (to && parseDate(to as string)) || new Date();
    // Defaults to 30 days before -- auto adjusted
    const fromDate =
      (from && parseDate(from as string)) ||
      new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() - 30);
    // Defaults to 1 hour, in seconds
    const minDuration = (Number(minRecordingMinutes) ?? 60) * 60;

    const users = await Recording.aggregate()
      .match({ createdAt: { $gte: fromDate, $lt: toDate } })
      .group({
        _id: '$ltid',
        email: { $first: '$email' },
        recordingsCount: { $sum: 1 },
        totalLength: { $sum: '$duration' },
      })
      .match({ totalLength: { $gte: minDuration } })
      .sort('-totalLength')
      .project({
        _id: 1,
        email: 1,
        recordingsCount: 1,
        totalLength: { $divide: ['$totalLength', 60] },
      });

    res
      .cookie('token', token, {
        httpOnly: true,
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      })
      .json({ count: users.length, users });
  } catch (error) {
    nextFunc(error);
  }
};

export const paymentAlerts = async (
  req: Request,
  res: Response,
  nextFunc: NextFunction
): Promise<void> => {
  let token: string = null;
  if (req.body.email) {
    token = await authenticateAdmin(req.body.email, req.body.password);
  } else {
    token = req.cookies.token as string;
  }

  if (!token) {
    res.status(401).send('unauthorized');
    return;
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      expand: ['data.customer'],
    });

    const stripeBalanceRecords = subscriptions.data
      .map((s) => ({
        customer: s.customer as Stripe.Customer,
        subscription: s,
      }))
      .filter((o) => o.customer.balance !== 0)
      .map((o) => {
        const {
          customer: {
            id: customerId,
            name,
            email,
            currency,
            balance,
            livemode,
            metadata: { userId },
          },
          subscription: {
            id: subscriptionId,
            items: {
              data: [
                {
                  price: { id: priceId },
                },
              ],
            },
          },
        } = o;
        return {
          subscriptionId,
          package: getPlanIdByPriceId(priceId),
          customerId,
          userId,
          name,
          email,
          currency,
          balance: (balance / 100).toFixed(2),
          livemode,
        };
      });

    // The proper way would be to get all subscriptions from PayPal, but unfortunately
    // PayPal doesn't support this. https://github.com/paypal/PayPal-REST-API-issues/issues/5
    const paypalRecords = await Payment.aggregate()
      .match({ provider: 'paypal' })
      .sort('-createdAt')
      .group({
        _id: '$userId',
        subscriptions: {
          $push: {
            subscriptionId: '$subscriptionId',
            package: '$plan',
            customerId: '$customerId',
            userId: '$userId',
            invoiceId: '$invoiceId',
            createdAt: '$createdAt',
          },
        },
        subscriptionsCount: { $sum: 1 },
      })
      .match({ subscriptionsCount: { $gte: 2 } });

    res.status(200).send(
      paymentAlertsView({
        stripeBalanceRecords,
        paypalRecords,
        live: NODE_ENV === PRODUCTION,
      })
    );
  } catch (error) {
    nextFunc(error);
  }
};

export const users = async (
  req: Request,
  res: Response,
  nextFunc: NextFunction
): Promise<void> => {
  const { from, to } = req.query;

  try {
    const endTime = (to && parseDate(to as string)) || new Date();
    const beginTime =
      (from && parseDate(from as string)) ||
      new Date(
        endTime.getFullYear(),
        endTime.getMonth(),
        endTime.getDate() - 30
      );
    const userReport = await getUserReport({ beginTime, endTime });

    res.json(userReport);
  } catch (error) {
    nextFunc(error);
  }
};

export const events = async (
  req: Request,
  res: Response,
  nextFunc: NextFunction
): Promise<void> => {
  const { from, to } = req.query;

  try {
    const endTime = (to && parseDate(to as string)) || new Date();
    const beginTime =
      (from && parseDate(from as string)) ||
      new Date(
        endTime.getFullYear(),
        endTime.getMonth(),
        endTime.getDate() - 30
      );
    const eventReport = await getEventReport({ beginTime, endTime });

    res.json(eventReport);
  } catch (error) {
    nextFunc(error);
  }
};

export const feedbacks = async (
  req: Request,
  res: Response,
  nextFunc: NextFunction
): Promise<void> => {
  const { from, to } = req.query;

  try {
    const endTime = (to && parseDate(to as string)) || new Date();
    const beginTime =
      (from && parseDate(from as string)) ||
      new Date(
        endTime.getFullYear(),
        endTime.getMonth(),
        endTime.getDate() - 30
      );

    const feedbacks = await Feedback.find({
      createdAt: { $gte: beginTime, $lt: endTime },
    }).sort('-createdAt');

    const result = feedbacks.map((f) => {
      const { email, name, rating, feedback, meta, createdAt, useCase } =
        f.format();
      const appVersion = meta?.app?.version;
      const browser = meta?.browser?.name;
      const browserVersion = meta?.browser?.version;
      const os = meta?.os?.name;
      const osVersion = meta?.os?.version;
      const screenResolution = meta?.screen?.resolution;
      const screenAspectRatio = meta?.screen?.aspectRatio;

      return {
        email,
        name,
        rating,
        feedback,
        useCase,
        appVersion,
        browser,
        browserVersion,
        os,
        osVersion,
        screenResolution,
        screenAspectRatio,
        createdAt: createdAt.toISOString(),
      };
    });

    res.json(result);
  } catch (error) {
    nextFunc(error);
  }
};
