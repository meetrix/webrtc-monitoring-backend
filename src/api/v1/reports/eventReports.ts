import { AnalyticsRecord } from '../../../models/AnalyticsRecord';

interface GetEventReportParams {
  beginTime: Date;
  endTime: Date;
}

export const getEventReport = async ({ beginTime, endTime }: GetEventReportParams) => {
  const beginTs = beginTime.getTime();
  const endTs = endTime.getTime();

  const recordings = await AnalyticsRecord
    .aggregate()
    .match({ t: { $gte: beginTs, $lt: endTs }, a: 'generate' }) // TODO Change to recording
    .group({
      _id: '$u',
      recordingsCount: { $sum: 1 },
      totalLength: { $sum: '$duration' }
    })
    .sort('-totalLength');

  const events = await AnalyticsRecord
    .aggregate()
    .match({ t: { $gte: beginTs, $lt: endTs } })
    .group({
      _id: { a: '$a', p: '$p' },
      count: { $sum: 1 }
    })
    .group({
      _id: '$_id.a',
      counts: { $push: { k: { $toString: '$_id.p' }, v: '$count' } }
    })
    .project({
      counts: { $arrayToObject: '$counts' }
    });

  return { recordings, events };
};
