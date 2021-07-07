import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { SESSION_SECRET } from '../../../config/secrets';
import { FileDocument } from '../../../models/FileSystemEntity';
import { RecordingRequest, RecordingRequestDocument } from '../../../models/RecordingRequest';
import { User, UserDocument } from '../../../models/User';
import { getSubscriptionStatus, signSecondaryUserToken } from '../../../util/auth';
import { deleteRecordings } from '../../../util/s3';
import { getMailOptions, getTransporter } from '../../../util/mail';
import { AUTH_LANDING } from '../../../config/settings';

const DAY = 365 * 24 * 60 * 60 * 1000; // TODO-> change to one day

const deleteOldFiles = async (
  recReq: RecordingRequestDocument,
  user: UserDocument,
  exceptLast: boolean
): Promise<void> => {
  const fileIds = [];
  for (let i = 0; i < recReq.fileIds.length - (exceptLast ? 1 : 0); i++) {
    const fileId = recReq.fileIds[i];
    const source = user.fileSystem.id(fileId);
    if (!source) {
      fileIds.push(fileId);
      continue;
    }
    await deleteRecordings([(source as FileDocument).providerKey]);
    user.fileSystem.pull(source);
  }
  recReq.fileIds = fileIds;
};

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
    if (!recReq || recReq.expiry < new Date() || recReq.sealed) {
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
    recReq.used = true;
    await recReq.save();

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
  if (recReq.sealed) { // Finalized recording
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

    await deleteOldFiles(recReq, user, false);

    await user.save();
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
    const { recReq, jwtUser } = await extractRequestDetails(token as string);

    const user = await User.findById(jwtUser.sub);
    if (!user.fileSystem) {
      throw new Error('No such file exists.');
    }

    await deleteOldFiles(recReq, user, true);

    recReq.sealed = true;
    await recReq.save();
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ success: false, error: error.message });
    return;
  }

  res.status(200).json({ success: true });
};

export const sendEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { key ,emailAddress} = req.body;
  if (!key) {
    res.status(401).json({ success: false, error: 'key is missing' });
    return;
  }
  if (!emailAddress) {
    res.status(401).json({ success: false, error: 'emailAddress is missing' });
    return;
  }

  try {
    const recReq = await RecordingRequest.findById(key);
    if (!recReq || recReq.expiry < new Date() || recReq.sealed) {
      res.status(404).json({ success: false, error: 'No such share link or link expired.' });
      return;
    }

    const user = await User.findById(recReq.ownerId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Recording requester not found.' });
      return;
    }

    const senderName = user.profile.name;

    const transporter = getTransporter();

    const mailOptions = getMailOptions({
      subject: `Request Recording - ${senderName}`,
      to: `<${emailAddress}>`,
      template: 'requestRecordingEmail',
      context: {
        senderName,
        key,
        AUTH_LANDING,
      }
    });

    transporter.sendMail(mailOptions, (err, data) => {
      if (err) {
         res.status(401).json({ success: false, error: 'emailAddress is missing' });
         return;
      }
    });

  
  } catch (error) {
    console.log('error-->',error.message);
    res.status(404).json({ success: false, error: error.message });
    return;
  }

  res.status(200).json({ success: true });
};
