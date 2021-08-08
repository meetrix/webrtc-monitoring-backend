import Stripe from 'stripe';
import {
  STRIPE_FREE_PRICE_ID,
  STRIPE_PREMIUM_MONTHLY_PRICE_ID,
  STRIPE_PREMIUM_PRICE_ID,
  STRIPE_SECRET_KEY,
  STRIPE_STANDARD_MONTHLY_PRICE_ID,
  STRIPE_STANDARD_PRICE_ID,
  USER_PACKAGES,
} from '../config/settings';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

/**
 * For Stripe
 * @param planId plan/package
 * @returns Stripe price id
 */
export const getPriceIdbyPlanId = (
  planId: string,
  period: 'yearly' | 'monthly' = 'yearly'
): string => {
  if (planId === USER_PACKAGES[0]) {
    return STRIPE_FREE_PRICE_ID;
  }

  if (period === 'monthly') {
    switch (planId) {
      case USER_PACKAGES[1]:
        return STRIPE_STANDARD_MONTHLY_PRICE_ID;
      case USER_PACKAGES[2]:
        return STRIPE_PREMIUM_MONTHLY_PRICE_ID;
      default:
        throw Error('invalid plan');
    }
  } else if (period === 'yearly') {
    switch (planId) {
      case USER_PACKAGES[1]:
        return STRIPE_STANDARD_PRICE_ID;
      case USER_PACKAGES[2]:
        return STRIPE_PREMIUM_PRICE_ID;
      default:
        throw Error('invalid plan');
    }
  } else {
    throw Error('invalid plan');
  }
};

/**
 * For Stripe
 * @param priceId Stripe price id
 * @returns plan/package
 */
export const getPlanIdByPriceId = (priceId: string): string => {
  switch (priceId) {
    case STRIPE_FREE_PRICE_ID:
      return USER_PACKAGES[0];
    case STRIPE_STANDARD_PRICE_ID: // fall-through
    case STRIPE_STANDARD_MONTHLY_PRICE_ID:
      return USER_PACKAGES[1];
    case STRIPE_PREMIUM_PRICE_ID: // fall-through
    case STRIPE_PREMIUM_MONTHLY_PRICE_ID:
      return USER_PACKAGES[2];
    default:
      throw Error('invalid plan');
  }
};
