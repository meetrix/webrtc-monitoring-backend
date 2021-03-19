import jwt from 'jsonwebtoken';

import { SESSION_SECRET } from '../config/secrets';
import { JWT_EXPIRATION, JWT_EXPIRATION_PLUGIN } from '../config/settings';
import { PluginDocument } from '../models/Plugin';
import { UserDocument } from '../models/User';

export const signToken = (user: UserDocument): string => {
  return jwt.sign(
    {
      email: user.email,
      role: user.role
    },
    SESSION_SECRET,
    {
      expiresIn: JWT_EXPIRATION,
      subject: user._id.toString()
    }
  );
};

export const signPluginToken = (plugin: PluginDocument): string => {
  // What kind of auth?
  return jwt.sign(
    {
      plugin: true,
      website: plugin.website,
    },
    SESSION_SECRET,
    {
      expiresIn: JWT_EXPIRATION_PLUGIN,
      subject: plugin.ownerId,
    }
  );
};
