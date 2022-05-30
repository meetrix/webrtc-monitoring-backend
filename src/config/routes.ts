import { Express } from 'express';

import { specRouter } from '../api/v1/specs';
import { accountRouter } from '../api/v1/account';
import { pluginRouter } from '../api/v1/plugins';
import { usersRouter } from '../api/v1/users';
import { authRouter } from '../api/v1/auth';
import { miscRouter } from '../api/v1/misc';
import { reportRouter } from '../api/v1/report';

export const setupRoutesV1 = (app: Express): void => {
  app.use('/v1/spec', specRouter);
  app.use('/v1/account', accountRouter);
  app.use('/v1/plugins', pluginRouter);
  app.use('/v1/users', usersRouter);
  app.use('/v1/auth', authRouter);
  app.use('/v1/misc', miscRouter);
  app.use('/v1/report', reportRouter);
};
