import { AnalyticsRecord } from '../../../models/AnalyticsRecord';

interface GetEventReportParams {
  beginTime: Date;
  endTime: Date;
}

export const getEventReport = async ({ beginTime, endTime }: GetEventReportParams) => {
  const beginTs = beginTime.getTime();
  const endTs = endTime.getTime();

  const events = await AnalyticsRecord
    .find({ t: { $gte: beginTs, $lt: endTs } });

  return { events };
};
