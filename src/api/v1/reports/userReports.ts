import { Payment } from '../../../models/Payment';
import { User } from '../../../models/User';
import { domains } from './emailProviderList';

const domainsSet = new Set(domains);

interface GetUserReportParams {
  beginTime: Date;
  endTime: Date;
}

export const getUserReport = async ({ beginTime, endTime }: GetUserReportParams) => {
  const userEmails: { email: string; createdAt: string; _id: string }[] = await User
    .aggregate()
    .match({ createdAt: { $gte: beginTime, $lt: endTime } })
    .project({
      email: 1,
      createdAt: 1,
    });
  const emails = userEmails.map(user => ({
    _id: user._id,
    email: user.email,
    createdAt: user.createdAt,
    isCorporate: !domainsSet.has(user.email.split('@')[1])
  }));

  const subscriptions = await Payment
    .aggregate()
    .sort({ createdAt: 1 })
    .group({
      _id: '$userId',
      docs: {
        $push: {
          plan: '$plan',
          provider: { $ifNull: ['$provider', 'stripe'] },
          createdAt: '$createdAt'
        }
      }
    })
    .project({
      _id: 1,
      docs: {
        $reduce: {
          input: '$docs',
          initialValue: { lastPlan: 'FREE_LOGGEDIN', docs: [] },
          in: {
            $cond: {
              if: {
                $ne: ['$$value.lastPlan', '$$this.plan']
              },
              then: {
                lastPlan: '$$this.plan',
                docs: { $concatArrays: ['$$value.docs', ['$$this']] }
              },
              else: '$$value'
            }
          }
        }
      }
    })
    .project({
      plans: {
        $filter: {
          input: '$docs.docs',
          cond: {
            $and: [{
              $gte: ['$$this.createdAt', beginTime]
            }, {
              $lt: ['$$this.createdAt', endTime]
            }]
          }
        }
      },
      lastPlan: '$docs.lastPlan'
    });

  return { subscriptions, emails, personalEmailProviders: domains };
};
