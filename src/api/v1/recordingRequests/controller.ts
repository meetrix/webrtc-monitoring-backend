import { Request, Response } from 'express';

import { RecordingRequest } from '../../../models/RecordingRequest';
import { User } from '../../../models/User';
import { getSubscriptionStatus, signSecondaryUserToken } from '../../../util/auth';

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
      res.status(401).json({ success: false, error: 'No such share link or link expired.' });
      return;
    }

    const user = await User.findById(recReq.ownerId);
    if (!user) {
      res.status(401).json({ success: false, error: 'Recording requester not found.' });
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

export const finish = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.params.key || req.params.key === 'undefined') {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const recReq = await RecordingRequest.findById(req.params.key);
    if (!recReq) {
      res.status(401).json({ success: false, error: 'No such share link.' });
      return;
    }

    const user = await User.findById(recReq.ownerId);
    if (!user) {
      res.status(401).json({ success: false, error: 'No recording requester found.' });
      return;
    }

    recReq.used = true;
    await recReq.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: 'Unknown server error.' });
  }
};
