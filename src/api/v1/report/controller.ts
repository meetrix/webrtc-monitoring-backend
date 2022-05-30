import { Response, NextFunction } from 'express';
import { AuthAwareRequest } from '../../../config/passport';

export const getReport = async (
  req: AuthAwareRequest,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  return res.status(200).json({});
};
