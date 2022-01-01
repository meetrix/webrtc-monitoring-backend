import jwt from 'jsonwebtoken';

import { SESSION_SECRET } from '../config/secrets';
import {
  JWT_EXPIRATION,
  JWT_EXPIRATION_PLUGIN,
  JWT_EXPIRATION_REC_REQ,
  SUBSCRIPTION_STATUSES,
} from '../config/settings';
import { PluginDocument } from '../models/Plugin';
import { RecordingRequestDocument } from '../models/RecordingRequest';
import { UserDocument } from '../models/User';

export interface UserTokenInformation {
  email: string;
  role: string;
}

export interface PluginTokenInformation {
  plugin: boolean;
  domain: string;
}

export type TokenInformation = UserTokenInformation | PluginTokenInformation;

export const signToken = (
  user: UserDocument,
  secret: string = SESSION_SECRET,
  expiresIn: string = JWT_EXPIRATION
): string => {
  return jwt.sign(
    {
      email: user.email,
      role: user.role,
    },
    secret,
    {
      expiresIn: expiresIn,
      subject: user._id.toString(),
    }
  );
};

export const signPluginToken = (
  plugin: PluginDocument,
  secret: string = SESSION_SECRET,
  expiresIn: string = JWT_EXPIRATION_PLUGIN
): string => {
  // What kind of auth?
  return jwt.sign(
    {
      plugin: true,
      domain: plugin.domain,
    },
    secret,
    {
      expiresIn,
      subject: plugin.ownerId,
    }
  );
};

export const signSecondaryUserToken = (
  recReq: RecordingRequestDocument
): string => {
  return jwt.sign(
    {
      recordingRequestId: recReq._id.toString(),
    },
    SESSION_SECRET,
    {
      expiresIn: JWT_EXPIRATION_REC_REQ,
      subject: recReq.ownerId,
    }
  );
};

/**
 * Find the subscription provider and the status
 */
export function getSubscriptionStatus(user: UserDocument): {
  subscriptionStatus: string;
  subscriptionProvider: string;
} {
  // Take the best subscription status from both paypal and stripe
  // active > inactive > pending
  // stripe > paypal
  const stripeStatus = user.stripe?.subscriptionStatus || 'pending';
  const paypalStatus = user.paypal?.subscriptionStatus || 'pending';
  if (
    SUBSCRIPTION_STATUSES.indexOf(paypalStatus) <=
    SUBSCRIPTION_STATUSES.indexOf(stripeStatus)
  ) {
    return { subscriptionStatus: stripeStatus, subscriptionProvider: 'stripe' };
  } else {
    return { subscriptionStatus: paypalStatus, subscriptionProvider: 'paypal' };
  }
}

export const verify = <T>(token: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      SESSION_SECRET,
      { algorithms: ['RS256', 'HS256'] },
      (err, decoded) => {
        if (err) {
          return reject(err);
        }
        return resolve(decoded as unknown as T);
      }
    );
  });
};
