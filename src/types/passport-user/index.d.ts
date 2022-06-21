import { Profile } from 'passport';
import { Request as ExpressRequest } from 'express';
import { UserDocument } from '../../models/User';

declare global {
  namespace Express {
    interface User extends UserDocument {}

    export interface IJwtUser {
      sub: string;
      iat: number;
      exp: number;
    }

    export interface JwtUser extends IJwtUser {
      email: string;
      role: string;
    }

    export interface JwtPluginUser extends IJwtUser {
      plugin: string;
      domain: string;
    }

    interface JwtSecondaryUser extends IJwtUser {
      recordingRequestId: string;
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
