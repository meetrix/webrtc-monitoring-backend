import { Response, Request, NextFunction } from 'express';
import Handlebars from 'handlebars';
// import stringify from 'csv-stringify';

import { Feedback } from '../../../models/Feedback';
import { indexTemplate, feedbacksTemplate } from './templates';

const indexView = Handlebars.compile(indexTemplate);
const feedbackView = Handlebars.compile(feedbacksTemplate);
export const index = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.status(200).send(indexView({}));
};

export const feedbackReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { from: fromStr, limit: limitStr, type = null, all = null } = req.query;
  const from = Number(fromStr) || 0;
  const limit = Number(limitStr) || 100;

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
        createdAt,
      };
    });

    if (type == 'json') {
      res.status(200).json(result);
    } else if (type == 'csv') {
      res.status(200).json('Not implemented yet. ');
      // res.type('text/csv').status(200).send(stringify(result));
    } else {
      const prev = from - limit < 0 ? null : from - limit;
      const next = result.length < limit ? null : from + limit;
      res.status(200).send(feedbackView({ records: result, prev, next, from, limit }));
    }
  } catch (error) {
    next(error);
  }
};
