import { getPriceIdbyPlanId, getPlanIdByPriceId } from '../../src/util/stripe';
import { USER_PACKAGES } from '../../src/config/settings';

describe('Stripe', () => {
  it('should get starndard monthly plan price id', () => {
    expect(getPriceIdbyPlanId(USER_PACKAGES[1], 'monthly')).toBe(
      process.env['STRIPE_STANDARD_MONTHLY_PRICE_ID']
    );
  });
  it('should get getPlanIdByPriceId', () => {
    expect(getPlanIdByPriceId(process.env['STRIPE_FREE_PRICE_ID'])).toBe(
      USER_PACKAGES[0]
    );
  });
});
