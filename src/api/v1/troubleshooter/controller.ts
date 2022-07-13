import { NextFunction, Request, Response } from 'express';

import { TroubleshooterSession } from '../../../models/TroubleshooterSession';

export const postSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Client is guaranteed to set a clientId
    if (!req.body.clientId) {
      res.status(400).json({ success: false, error: 'No clientId set' });
      console.log('No clientId set', req.path, req.body);
      return;
    }

    // Auth should set pluginId from token
    if (!req.body.pluginId) {
      res.status(400).json({ success: false, error: 'No pluginId set' });
      console.log('No pluginId set', req.path, req.body);
      return;
    }

    // ownerId, pluginId, clientId
    const saved = await new TroubleshooterSession(req.body).save();

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const getSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await TroubleshooterSession.findById(req.params.id);
    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }

    if (req.user.id !== session.ownerId) {
      res.status(403).json({
        success: false,
        error: 'You are not authorized to view this session',
      });
      return;
    }

    res.status(200).json({ success: false, data: session });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const getSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      limit,
      offset,
      pluginId,
      clientId,
      startTime,
      endTime,
      sortBy,
      direction,
      testId,
    } = req.query;
    const limitNumber = parseInt((limit as string) || '10', 10);
    const offsetNumber = parseInt((offset as string) || '0', 10);
    const sortOrder = sortBy.toString();
    const inputTextId = testId?.toString();

    const sessions = await TroubleshooterSession.find({
      ownerId: req.user.id as string,
      ...(pluginId && { pluginId: pluginId as string }),
      ...(clientId && { clientId: clientId as string }),
      ...(testId && { _id: inputTextId }),
      ...(startTime &&
        endTime && {
          createdAt: {
            $gte: new Date(startTime as string),
            $lt: new Date(endTime as string),
          },
        }),
    })
      .sort({ [sortOrder]: direction })
      .limit(limitNumber)
      .skip(offsetNumber);

    const totalDataCount = await TroubleshooterSession.find().count({
      ownerId: req.user.id as string,
      ...(pluginId && { pluginId: pluginId as string }),
      ...(clientId && { clientId: clientId as string }),
      ...(testId && { _id: inputTextId }),
      ...(startTime &&
        endTime && {
          createdAt: {
            $gte: new Date(startTime as string),
            $lt: new Date(endTime as string),
          },
        }),
    });

    res.status(200).json({
      success: true,
      data: { sessions: sessions, total: totalDataCount },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const getSessionSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { pluginId, clientId, startTime, endTime } = req.query;

    const summary = await TroubleshooterSession.aggregate()
      .match({
        ownerId: req.user.id as string,
        ...(pluginId && { pluginId: pluginId as string }),
        ...(clientId && { clientId: clientId as string }),
        ...(startTime &&
          endTime && {
            createdAt: {
              $gte: new Date(startTime as string),
              $lt: new Date(endTime as string),
            },
          }),
      })
      .project({
        tests: 1,
        createdAt: 1,
      })
      .group({
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: 1 },
        passed: { $sum: { $toInt: '$tests.overall.status' } },
        browser: { $sum: { $toInt: '$tests.browser.status' } },
        microphone: { $sum: { $toInt: '$tests.microphone.status' } },
        camera: { $sum: { $toInt: '$tests.camera.status' } },
        network: { $sum: { $toInt: '$tests.network.status' } },
      });

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
