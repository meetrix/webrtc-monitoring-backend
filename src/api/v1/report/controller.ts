import { NextFunction, Request, Response } from 'express';
import { AuthAwareRequest } from '../../../config/passport';
import { Participant } from '../../../models/Participant';
import { Room } from '../../../models/Room';

export const getReport = async (
  req: AuthAwareRequest,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  return res.status(200).json({});
};

export const roomStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for a roomName
    if (!req.body.roomName) {
      res.status(400).json({ success: false, error: 'No roomName set' });
      console.log('No roomName set', req.path, req.body);
      return;
    }

    // Check for a roomJid
    if (!req.body.roomJid) {
      res.status(400).json({ success: false, error: 'No roomJid set' });
      console.log('No roomJid set', req.path, req.body);
      return;
    }

    // Check for a event
    if (!req.body.event) {
      res.status(400).json({ success: false, error: 'No event set' });
      console.log('No event set', req.path, req.body);
      return;
    }

    if (req.body.event == 'create') {
      const payload = {
        roomName: req.body.roomName,
        roomJid: req.body.roomJid,
        created: Date.now(),
        destroyed: 0,
      };

      const saved = await new Room(payload).save();
      res.status(201).json({ success: true, data: saved });
      return;
    } else if (req.body.event == 'destroy') {
      const room = await Room.findOne({ roomJid: req.body.roomJid }).sort({
        created: 'desc',
      });
      if (!room) {
        res
          .status(401)
          .json({ success: false, data: null, message: 'Room not found' });
        return;
      }
      room.destroyed = Date.now();
      await room.save();

      res.status(201).json({ success: true, data: null });
      return;
    } else {
      res.status(400).json({ success: false, error: 'Unidentified event' });
      console.log('Unidentified event', req.path, req.body);
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const paricipantsStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for a Required parameters
    if (
      !req.body.bareJid ||
      !req.body.roomUserJid ||
      !req.body.displayName ||
      !req.body.roomJid
    ) {
      res
        .status(400)
        .json({ success: false, error: 'Required parameters not set' });
      console.log('Required parameters not set', req.path, req.body);
      return;
    }

    if (req.body.event == 'join') {
      const room = await Room.findOne({ roomJid: req.body.roomJid }).sort({
        created: 'desc',
      });
      if (!room) {
        res
          .status(401)
          .json({ success: false, data: null, message: 'Room not found' });
        return;
      }
      const payload = {
        participantName: req.body.displayName,
        participantJid: req.body.bareJid,
        participantRoomJid: req.body.roomUserJid,
        roomName: req.body.roomName,
        roomJid: req.body.roomJid,
        roomId: room._id,
        joined: Date.now(),
        left: 0,
      };

      const saved = await new Participant(payload).save();
      res.status(201).json({ success: true, data: saved });
      return;
    } else if (req.body.event == 'leave') {
      const participant = await Participant.findOne({
        participantJid: req.body.bareJid,
        participantRoomJid: req.body.roomUserJid,
      }).sort({
        joined: 'desc',
      });
      if (!participant) {
        res.status(401).json({
          success: false,
          data: null,
          message: 'Participant not found',
        });
        return;
      }
      participant.left = Date.now();
      await participant.save();

      res.status(201).json({ success: true, data: null });
      return;
    } else {
      res.status(400).json({ success: false, error: 'Unidentified event' });
      console.log('Unidentified event', req.path, req.body);
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
