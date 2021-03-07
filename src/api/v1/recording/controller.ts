import { Request, Response, NextFunction } from 'express';
import { Recording } from '../../../models/Recording';

export const trackRecording = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { ltid, email, duration } = req.body;

  try {
    const recordingDocument = new Recording({ ltid, email, duration });
    // createdAt field is automatically added with server time.
    recordingDocument.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};
