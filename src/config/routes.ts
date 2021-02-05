import { Express } from 'express';
import { specRouter } from '../api/v1/specs';
import { accountRouter } from '../api/v1/account';
import { usersRouter } from '../api/v1/users';
import { uploadRouter } from '../api/v1/upload';
import { authRouter } from '../api/v1/auth';
import { feedbackRouter } from '../api/v1/feedback';
import { subscriptionRouter } from '../api/v1/subscription';
import { reportsRouter } from '../api/v1/reports';
export const setupRoutesV1 = (app: Express): void => {
  app.use('/v1/spec', specRouter);
  app.use('/v1/reports', reportsRouter);
  app.use('/v1/account', accountRouter);
  app.use('/v1/users', usersRouter);
  app.use('/v1/upload', uploadRouter);
  app.use('/v1/auth', authRouter);
  app.use('/v1/feedback', feedbackRouter);
  app.use('/v1/subscription', subscriptionRouter);
};
