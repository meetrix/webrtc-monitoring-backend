import { Express } from 'express';
import { specRouter } from '../api/v1/specs';
import { accountRouter } from '../api/v1/account';
import { usersRouter } from '../api/v1/users';
import { uploadRouter } from '../api/v1/upload';
import { authRouter } from '../api/v1/auth';
import { subscriptionRouter } from '../api/v1/subscription';
import { miscRouter } from '../api/v1/misc';
import { clientsRouter } from '../api/v1/client';
import { reportRouter } from '../api/v1/report';

export const setupRoutesV1 = (app: Express): void => {
  app.use('/v1/spec', specRouter);
  app.use('/v1/account', accountRouter);
  app.use('/v1/users', usersRouter);
  app.use('/v1/upload', uploadRouter);
  app.use('/v1/auth', authRouter);
  app.use('/v1/subscription', subscriptionRouter);
  app.use('/v1/misc', miscRouter);
  app.use('/v1/client', clientsRouter);
  app.use('/v1/report', reportRouter);
};
