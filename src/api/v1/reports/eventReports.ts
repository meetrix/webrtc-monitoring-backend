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
    .match({ t: { $gte: beginTs, $lt: endTs }, a: 'recording-end' })
    .group({
      _id: '$u',
      recordingsCount: { $sum: 1 },
      totalLength: { $sum: '$d.duration' }
    })
    .sort('-totalLength');

  const recordingFeatures = await AnalyticsRecord
    .aggregate()
    .match({ t: { $gte: beginTs, $lt: endTs }, a: 'recording-end' })
    .group({
      _id: 1,
      totalLength: { $sum: '$d.duration' },
      count: { $sum: 1 },
      local: { $sum: { $cond: [{ $eq: ['$d.tab', 'local'] }, 1, 0] } },
      cloud: { $sum: { $cond: [{ $eq: ['$d.tab', 'cloud'] }, 1, 0] } },
      plugin: { $sum: { $cond: [{ $eq: ['$d.tab', 'plugin'] }, 1, 0] } },
      folder: { $sum: { $cond: ['$d.folder', 1, 0] } },
      sync: { $sum: { $cond: ['$d.sync', 1, 0] } },
      browserAudio: { $sum: { $cond: ['$d.features.browserAudio', 1, 0] } },
      mic: { $sum: { $cond: ['$d.features.mic', 1, 0] } },
      webcam: { $sum: { $cond: ['$d.features.webcam', 1, 0] } },
      noAudio: { $sum: { $cond: [{ $or: ['$d.features.browserAudio', '$d.features.mic'] }, 0, 1] } },
    });

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

  return { recordings, recordingFeatures, events };
};
