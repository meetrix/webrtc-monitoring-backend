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
    // email: user.email,
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
      all: {
        $reduce: {
          input: '$docs',
          initialValue: {
            lastPlan: 'FREE_LOGGEDIN',
            docs: []
          },
          in: {
            $cond: {
              if: {
                $ne: ['$$value.lastPlan', '$$this.plan']
              },
              then: {
                lastPlan: '$$this.plan',
                docs: {
                  $concatArrays: [
                    '$$value.docs',
                    [
                      {
                        plan: '$$this.plan',
                        provider: '$$this.provider',
                        createdAt: '$$this.createdAt',
                        label: {
                          $switch: {
                            branches: [
                              {
                                case: { $eq: ['$$value.lastPlan', 'FREE_LOGGEDIN'] },
                                then: 'new'
                              },
                              {
                                case: { $eq: ['$$this.plan', 'FREE_LOGGEDIN'] },
                                then: 'cancel'
                              },
                              {
                                case: {
                                  $and: [
                                    { $eq: ['$$this.plan', 'PREMIUM'] },
                                    { $eq: ['$$value.lastPlan', 'STANDARD'] }
                                  ]
                                },
                                then: 'upgrade'
                              },
                              {
                                case: {
                                  $and: [
                                    { $eq: ['$$this.plan', 'STANDARD'] },
                                    { $eq: ['$$value.lastPlan', 'PREMIUM'] }
                                  ]
                                },
                                then: 'downgrade'
                              }
                            ],
                            default: 'unknown'
                          }
                        },
                      }
                    ]
                  ]
                }
              },
              else: '$$value'
            }
          }
        }
      },
    })
    .project({
      plans: {
        $filter: {
          input: '$all.docs',
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
