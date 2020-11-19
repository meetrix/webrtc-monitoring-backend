import { UserDocument } from '../models/User';
import jwt from 'jsonwebtoken';
import { SESSION_SECRET } from '../config/secrets';
import { JWT_EXPIRATION } from '../config/settings';
export const signToken = (user: UserDocument): string => {
  return jwt.sign(
    {
      email: user.email,
      role: user.role
    },
    SESSION_SECRET,
    {
      expiresIn: JWT_EXPIRATION,
      subject: user.id
    }
  );
};
