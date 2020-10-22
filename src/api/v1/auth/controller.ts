import { Response, NextFunction } from 'express';
import { signToken } from '../../../util/auth';
import { UserDocument } from '../../../models/User';
import { AUTH_LANDING } from '../../../config/settings';

export const authCallback = (req: any, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw 'User not found';
    }
    const user = req.user as UserDocument;
    res.redirect(`${AUTH_LANDING}?token=${signToken(user)}`);
  } catch (error) {
    next(error);
  }
};
