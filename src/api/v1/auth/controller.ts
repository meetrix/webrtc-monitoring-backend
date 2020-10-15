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
        res.redirect(`${AUTH_LANDING}?token=${signToken(user)}`);
        user.isVerified = true,
            await user.save();

    } catch (error) {
        next(error);
    }
};
