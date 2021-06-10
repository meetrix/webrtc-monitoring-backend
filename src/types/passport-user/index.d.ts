import { Profile } from 'passport';
import { Request as ExpressRequest } from 'express';
import { UserDocument } from '../../models/User';

declare global {
  namespace Express {
    interface User extends UserDocument {

    }

    interface IJwtUser {
      sub: string;
      iat: number;
      exp: number;
    }

    interface JwtUser extends IJwtUser {
      email: string;
      role: string;
    }

    interface JwtPluginUser extends IJwtUser {
      plugin: boolean;
      website: string;
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
