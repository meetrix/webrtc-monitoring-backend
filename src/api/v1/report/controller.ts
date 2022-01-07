import { Response, NextFunction } from 'express';
import { getActiveClientIds } from '../../../util/redis/plugins';
import { Plugin } from '../../../models/Plugin';
import { AuthAwareRequest } from '../../../config/passport';
import logger from '../../../util/logger';

export const getReport = async (
  req: AuthAwareRequest,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  return res.status(200).json({});
};
