import {
  PAYPAL_FREE_PLAN_ID,
  PAYPAL_PREMIUM_MONTHLY_PLAN_ID,
  PAYPAL_PREMIUM_MONTHLY_TRIAL_PLAN_ID,
  PAYPAL_PREMIUM_PLAN_ID,
  PAYPAL_PREMIUM_TRIAL_PLAN_ID,
  PAYPAL_STANDARD_MONTHLY_PLAN_ID,
  PAYPAL_STANDARD_MONTHLY_TRIAL_PLAN_ID,
  PAYPAL_STANDARD_PLAN_ID,
  PAYPAL_STANDARD_TRIAL_PLAN_ID,
  STRIPE_PREMIUM_MONTHLY_PRICE_ID,
  STRIPE_PREMIUM_PRICE_ID,
  STRIPE_STANDARD_MONTHLY_PRICE_ID,
  STRIPE_STANDARD_PRICE_ID,
} from '../../../config/settings';
import { Payment } from '../../../models/Payment';
import { User } from '../../../models/User';
import { domains } from './emailProviderList';

const domainsSet = new Set(domains);

interface GetUserReportParams {
  beginTime: Date;
  endTime: Date;
}

interface Plan {
  createdAt: Date;
  isTrial: boolean;
  key: string;
  period: string;
  plan: string;
  priceId: string;
  provider: string;
}

const isATrialPlan = (payPalPlanId: string): boolean => {
  switch (payPalPlanId) {
    case PAYPAL_STANDARD_TRIAL_PLAN_ID: // fall-through
    case PAYPAL_STANDARD_MONTHLY_TRIAL_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_TRIAL_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_MONTHLY_TRIAL_PLAN_ID:
      return true;

    case PAYPAL_FREE_PLAN_ID: // fall-through
    case PAYPAL_STANDARD_PLAN_ID: // fall-through
    case PAYPAL_STANDARD_MONTHLY_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_MONTHLY_PLAN_ID: // fall-through
    default:
      return false;
  }
};

const attachPayPalPeriodInformation = (planInfo: Plan): Plan => {
  const { priceId } = planInfo;
  let period = 'none';

  switch (priceId) {
    case PAYPAL_STANDARD_PLAN_ID: // fall-through
    case PAYPAL_STANDARD_TRIAL_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_TRIAL_PLAN_ID:
      period = 'yearly';
      break;

    case PAYPAL_STANDARD_MONTHLY_PLAN_ID: // fall-through
    case PAYPAL_STANDARD_MONTHLY_TRIAL_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_MONTHLY_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_MONTHLY_TRIAL_PLAN_ID:
      period = 'monthly';
      break;
    default:
      break;
  }

  return { period, ...planInfo };
};

const attachStripePeriodInformation = (planInfo: Plan): Plan => {
  const { priceId } = planInfo;
  let period = 'none';

  switch (priceId) {
    case STRIPE_STANDARD_PRICE_ID: // fall-through
    case STRIPE_PREMIUM_PRICE_ID:
      period = 'yearly';
      break;

    case STRIPE_STANDARD_MONTHLY_PRICE_ID: // fall-through
    case STRIPE_PREMIUM_MONTHLY_PRICE_ID:
      period = 'monthly';
      break;
    default:
      break;
  }

  return { period, ...planInfo };
};

const attachPeriodInformation = (planInfo: Plan): Plan => {
  if (planInfo.provider === 'paypal') {
    return attachPayPalPeriodInformation(planInfo);
  } else if (planInfo.provider === 'stripe') {
    return attachStripePeriodInformation(planInfo);
  } else {
    return planInfo;
  }
};

const attachTrialInformation = (planInfo: Plan): Plan => {
  const { isTrial, ...rest } = planInfo;
  return {
    ...rest,
    isTrial:
      planInfo.provider === 'paypal' ? isATrialPlan(planInfo.priceId) : isTrial,
  };
};

const paymentsByUser = {
  _id: '$userId',
  docs: {
    $push: {
      // Consider all params: plan, period, trial, provider
      // For PayPal, price id is unique for plan+period+trial;
      // For stripe, we have to track trials w/ amountPaid.
      key: { $concat: ['$priceId', '--', { $toString: '$amountPaid' }] },
      plan: '$plan',
      provider: { $ifNull: ['$provider', 'stripe'] },
      createdAt: '$createdAt',
      // Trial: This doesn't work for paypal -- looks like all paypal trial plans are missing
      isTrial: { $eq: ['$amountPaid', 0] },
      priceId: '$priceId',
    },
  },
};

// Distinct until changed by a unique key that virtually includes provider+plan+period+trial
const distinctUntilChangedByPlan = {
  $reduce: {
    input: '$docs',
    initialValue: {
      lastKey: '',
      lastPlan: 'FREE_LOGGEDIN',
      lastTrial: false,
      docs: [] as unknown[],
    },
    in: {
      $cond: {
        if: {
          $ne: ['$$value.lastKey', '$$this.key'],
        },
        then: {
          lastKey: '$$this.key',
          lastPlan: '$$this.lastPlan',
          lastTrial: '$$this.isTrial',
          docs: {
            $concatArrays: [
              '$$value.docs',
              [
                {
                  key: '$$this.key',
                  plan: '$$this.plan',
                  provider: '$$this.provider',
                  createdAt: '$$this.createdAt',
                  isTrial: '$$this.isTrial',
                  priceId: '$$this.priceId',
                },
              ],
            ],
          },
        },
        else: '$$value',
      },
    },
  },
};

export const getUserReport = async ({
  beginTime,
  endTime,
}: GetUserReportParams) => {
  const userEmails: { email: string; createdAt: string; _id: string }[] =
    await User.aggregate()
      .match({ createdAt: { $gte: beginTime, $lt: endTime } })
      .project({
        email: 1,
        createdAt: 1,
      });
  const emails = userEmails.map((user) => ({
    _id: user._id,
    email: user.email,
    createdAt: user.createdAt,
    isCorporate: !domainsSet.has(user.email.split('@')[1]),
  }));

  const subscriptionsRaw = await Payment.aggregate()
    .match({ paid: true })
    .sort({ createdAt: 1 })
    .group(paymentsByUser)
    // Finds all points where the key changed. Key represents plan, provider, trial, period.
    .project({
      _id: 1,
      all: distinctUntilChangedByPlan,
    })
    .project({
      plans: {
        $filter: {
          input: '$all.docs',
          cond: {
            $and: [
              {
                $gte: ['$$this.createdAt', beginTime],
              },
              {
                $lt: ['$$this.createdAt', endTime],
              },
            ],
          },
        },
      },
      lastPlan: '$docs.lastPlan',
    });

  const cancelledUsers: Set<string> = new Set(
    (
      await User.find(
        {
          limitedPackage: { $exists: true, $ne: 'FREE_LOGGEDIN' },
          package: 'FREE_LOGGEDIN',
        },
        { _id: 1 }
      )
    ).map((user) => user._id)
  );

  const subscriptions = subscriptionsRaw.map(
    ({ _id, plans }: { _id: string; plans: Plan[] }) => {
      if (plans.length > 0 && cancelledUsers.has(_id)) {
        const cancellation: Plan = {
          provider: plans[plans.length - 1].provider,
          isTrial: false,
          key: '',
          period: 'none',
          plan: 'FREE_LOGGEDIN',
          priceId: '',
          // This created at date is incorrect; this assumes the cancellation
          // happened at the same time as the last payment
          createdAt: plans[plans.length - 1].createdAt,
        };

        plans.push(cancellation);
      }

      return {
        _id,
        plans: plans.map((planInfo: Plan) => {
          const billingPeriodsAttached = attachPeriodInformation(planInfo);
          const trialInformationAttached = attachTrialInformation(
            billingPeriodsAttached
          );
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { key, priceId, ...cleaned } = trialInformationAttached;
          return cleaned;
        }),
      };
    }
  );

  return { subscriptions, emails, personalEmailProviders: domains };
};
