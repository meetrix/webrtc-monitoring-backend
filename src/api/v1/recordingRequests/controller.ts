import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { SESSION_SECRET } from '../../../config/secrets';
import { FileDocument } from '../../../models/FileSystemEntity';
import { RecordingRequest, RecordingRequestDocument } from '../../../models/RecordingRequest';
import { User } from '../../../models/User';
import { getSubscriptionStatus, signSecondaryUserToken } from '../../../util/auth';
import { deleteRecordings } from '../../../util/s3';

const DAY = 24 * 60 * 60 * 1000;

export const create = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const recReq = await (new RecordingRequest({
      ownerId: req.user._id,
      expiry: new Date(Date.now() + DAY)
    })).save();

    res.status(201).json({ success: true, data: recReq });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

export const init = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.params.key || req.params.key === 'undefined') {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const recReq = await RecordingRequest.findById(req.params.key);
    if (!recReq || recReq.expiry < new Date() || recReq.used) {
      res.status(404).json({ success: false, error: 'No such share link or link expired.' });
      return;
    }

    const user = await User.findById(recReq.ownerId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Recording requester not found.' });
      return;
    }

    // Doing this without the authorization middleware since the function could
    // be invoked by an anonymous user
    if (user.package !== 'PREMIUM' || getSubscriptionStatus(user).subscriptionStatus !== 'active') {
      res.status(403).json({ success: false, error: 'Forbidden (no valid subscription).' });
      return;
    }

    const token = signSecondaryUserToken(recReq);
    res.status(200).json({ success: true, data: { token } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};

const extractRequestDetails = async (token: string): Promise<{
  jwtUser: Express.JwtSecondaryUser;
  recReq: RecordingRequestDocument;
}> => {
  const jwtUser = jwt.verify(token, SESSION_SECRET) as Express.JwtSecondaryUser;
  if (!jwtUser) {
    throw new Error('Link not found or expired.');
  }

  const recReq = await RecordingRequest.findById(jwtUser.recordingRequestId);
  if (recReq.used) {
    throw new Error('Link not found or expired.');
  }
  return { jwtUser, recReq };
};

export const undo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token } = req.query;
  if (!token) {
    res.status(401).json({ success: false, error: 'Token is missing' });
    return;
  }

  try {
    const { recReq, jwtUser } = await extractRequestDetails(token as string);

    const user = await User.findById(jwtUser.sub);
    if (!user.fileSystem) {
      throw new Error('No such file exists.');
    }

    const source = user.fileSystem.id(recReq.fileId);
    if (!source) {
      throw new Error('No such file exists.');
    }

    await deleteRecordings([(source as FileDocument).providerKey]);
    user.fileSystem.pull(source);
    await user.save();
    recReq.fileId = '';
    await recReq.save();
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ success: false, error: error.message });
    return;
  }

  res.status(200).json({ success: true });
};

export const finish = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token } = req.query;
  if (!token) {
    res.status(401).json({ success: false, error: 'Token is missing' });
    return;
  }

  try {
    const { recReq } = await extractRequestDetails(token as string);
    recReq.used = true;
    await recReq.save();
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ success: false, error: error.message });
    return;
  }

  res.status(200).json({ success: true });
};
