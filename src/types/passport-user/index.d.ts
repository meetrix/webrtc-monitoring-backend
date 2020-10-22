import { Profile } from 'passport';
import { Request as ExpressRequest } from 'express';
import { UserDocument } from '../../models/User';

declare global {
  namespace Express {
    interface User {
      email: string;
      role: string;
      sub: string;
      iat: number;
      exp: number;
    }
  }
  namespace Passport {
    interface ExtendedProfile extends Profile {
      _json: {
        name: string;
        email: string;
        picture: string;
      };
    }
  }
}
