import { Response, Request, NextFunction } from 'express';
import { User, UserAPIFormat } from '../../../models/User';
import { AuthAwareRequest } from '../../../config/passport';

export const index = async (
  _req: AuthAwareRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find({});
    const result = {
      data: new Array<UserAPIFormat>(),
    };
    for (const user of users) {
      result.data.push(user.format());
    }
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
