import crypto from 'crypto';
import { User } from '../src/models/User';
import { SESSION_SECRET } from '../src/config/secrets';
import { signToken } from '../src/util/auth';

interface JWTData {
  id: string;
  email: string;
  role: string;
  exp: string;
}
export interface JWTPayload {
  email: string;
  role: string;
  sub: string;
  exp: number;
}
export interface RegisterUserOptions {
  role?: string;
  jwtExpiration?: string;
  randomize?: boolean;
  email?: string;
  password?: string;
}
export const GENERIC_UPLOAD_USER_ID = 'GENERIC_UPLOAD_USER_ID';

export const registerValidUser = async ({
  randomize = false,
  role = 'user',
  jwtExpiration = '5s',
  email = 'valid@email.com',
  password = 'valid_password',
}: RegisterUserOptions): Promise<string> => {
  const user = {
    email: randomize
      ? `${crypto.randomBytes(16).toString('hex')}@valid.com`
      : email,
    password: password,
    role: role,
  };

  const _user = await User.create(user);
  return signToken(_user, SESSION_SECRET, jwtExpiration);
};
