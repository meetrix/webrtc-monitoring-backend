import jwt from 'jsonwebtoken';

import { SESSION_SECRET } from '../config/secrets';
import {
  JWT_EXPIRATION,
  JWT_EXPIRATION_REC_REQ,
  SUBSCRIPTION_STATUSES,
} from '../config/settings';
import { RecordingRequestDocument } from '../models/RecordingRequest';
import { UserDocument } from '../models/User';

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
