import { Response, NextFunction } from 'express';
import { signToken } from '../../../util/auth';
import { UserDocument, User } from '../../../models/User';
import { AUTH_LANDING } from '../../../config/settings';

export const authCallback = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw 'User not found';
    }
    const user = req.user as UserDocument;
    user.isVerified = true,
      user.tag;
    user.tag.tagId = null,
      user.tag.title = null,
      user.tag.status = null,
      user.tag.createdAt = null,
      user.accessToken = signToken(user),

      await user.save();
    res.redirect(`${AUTH_LANDING}/#/dashboard?token=${user.accessToken}`);
    /*res.status(200).json({
      success: true,
      data: { accessToken: user.accessToken },
      message: 'User authorized successfully. Redirecting...'
    });
    */
  } catch (error) {
    res.status(500).json({
      success: true,
      data: null,
      message: 'User authorization unsuccessful. Please try again.'
    });
    next(error);
  }
};
