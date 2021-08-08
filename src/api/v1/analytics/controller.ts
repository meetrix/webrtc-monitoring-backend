import { Request, Response } from 'express';
import { AnalyticsRecord } from '../../../models/AnalyticsRecord';

export const track = async (req: Request, res: Response): Promise<void> => {
  try {
    const analyticsRecord = new AnalyticsRecord(req.body);
    await analyticsRecord.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};
