import jwt from 'jsonwebtoken';

import { SESSION_SECRET } from '../config/secrets';
import { JWT_EXPIRATION, JWT_EXPIRATION_PLUGIN, SUBSCRIPTION_STATUSES } from '../config/settings';
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
  if (SUBSCRIPTION_STATUSES.indexOf(paypalStatus) <= SUBSCRIPTION_STATUSES.indexOf(stripeStatus)) {
    return { subscriptionStatus: stripeStatus, subscriptionProvider: 'stripe' };
  } else {
    return { subscriptionStatus: paypalStatus, subscriptionProvider: 'paypal' };
  }
}
