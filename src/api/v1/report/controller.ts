import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthAwareRequest } from '../../../config/passport';
import { Participant, ParticipantType } from '../../../models/Participant';
import { Room, RoomType } from '../../../models/Room';
import { Stat } from '../../../models/Stat';
import { ErrorEvent } from '../../../models/ErrorEvent';

export const getReport = async (
  req: AuthAwareRequest,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  return res.status(200).json({});
};

export const postRoomStats = async (
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
      const payload: RoomType = {
        roomName: req.body.roomName,
        roomJid: req.body.roomJid,
        faulty: 0,
        created: new Date(),
        destroyed: null,
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
      room.destroyed = new Date();
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

export const getRoomStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      limit,
      offset,
      roomId,
      roomJid,
      startTime,
      endTime,
      sortBy,
      direction,
    } = req.query;
    const limitNumber = parseInt((limit as string) || '10', 10);
    const offsetNumber = parseInt((offset as string) || '0', 10);
    const sortOrder = sortBy.toString();

    const rooms = await Room.find({
      ...(roomId && { _id: roomId as string }),
      ...(roomJid && { roomJid: roomJid as string }),
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
      .skip(offsetNumber)
      .populate('participants');

    const totalRooms = await Room.find({
      ...(roomId && { _id: roomId as string }),
      ...(roomJid && { roomJid: roomJid as string }),
      ...(startTime &&
        endTime && {
          createdAt: {
            $gte: new Date(startTime as string),
            $lt: new Date(endTime as string),
          },
        }),
    });

    let totalMinutes = 0;
    let totalParticipants = 0;
    for (const room of rooms) {
      if (room.destroyed) {
        totalMinutes += Math.round(
          (room.destroyed.getTime() - room.created.getTime()) / 60000
        );
        totalParticipants += room.participants;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        rooms,
        total: totalRooms.length,
        totalMinutes,
        totalParticipants,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const getParticipantStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      limit,
      offset,
      roomId,
      participantId,
      participantJid,
      startTime,
      endTime,
      sortBy,
      direction,
    } = req.query;
    const limitNumber = parseInt((limit as string) || '10', 10);
    const offsetNumber = parseInt((offset as string) || '0', 10);
    const sortOrder = sortBy.toString();

    const participants = await Participant.find({
      ...(participantId && {
        _id: participantId as string,
      }),
      ...(participantJid && { participantJid: participantJid as string }),
      ...(roomId && { roomId: roomId as string }),
      ...(startTime &&
        endTime && {
          createdAt: {
            $gte: new Date(startTime as string),
            $lt: new Date(endTime as string),
          },
        }),
    })
      .populate('roomId')
      .sort({ [sortOrder]: direction })
      .limit(limitNumber)
      .skip(offsetNumber);

    const totalDataCount = await Participant.find().count({
      ...(roomId && { roomId: roomId as string }),
      ...(participantJid && { participantJid: participantJid as string }),
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
      data: { participants: participants, total: totalDataCount },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const postParticipantsStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for a Required parameters
    if (!req.body.bareJid || !req.body.roomUserJid || !req.body.roomJid) {
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

      const payload: ParticipantType = {
        participantName: req.body.displayName
          ? req.body.displayName
          : 'Felllow Jitster',
        participantJid: req.body.bareJid,
        participantRoomJid: req.body.roomUserJid,
        roomName: req.body.roomName,
        roomJid: req.body.roomJid,
        roomId: room._id,
        faulty: 0,
        joined: new Date(),
        left: null,
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
      participant.left = new Date();
      await participant.save();

      res.status(201).json({ success: true, data: null });
      return;
    } else if (req.body.event == 'nick-change') {
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
      participant.participantName = req.body.displayName
        ? req.body.displayName
        : 'Felllow Jitster';
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

export const getSummary2 = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { participantId, startTime, endTime } = req.query;
    console.log(participantId);

    const summary = await Stat.aggregate()
      .match({
        ...(participantId && {
          participantId: new Types.ObjectId(participantId as string),
        }),
        event: {
          $in: ['onicecandidate', 'onsignalingstatechange', 'mediaInfo'],
        },
        ...(startTime &&
          endTime && {
            createdAt: {
              $gte: new Date(startTime as string),
              $lt: new Date(endTime as string),
            },
          }),
      })
      .sort({ createdAt: 'ASC' })
      .group({
        _id: '$event',
        total: { $sum: 1 },
        icecandidates: { $push: '$data.candidate' },
        data: { $last: '$data' },
      });

    const summaryPayload = {
      icecandidates: summary.find((obj) => {
        return obj._id === 'onicecandidate';
      }),
      sdp: summary.find((obj) => {
        return obj._id === 'onsignalingstatechange';
      }),
      mediaInfo: summary.find((obj) => {
        return obj._id === 'mediaInfo';
      }),
    };

    res.status(200).json({
      success: true,
      data: summaryPayload,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const getSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      limit,
      offset,
      roomId,
      participantId,
      startTime,
      endTime,
      sortBy,
      direction,
    } = req.query;
    const limitNumber = parseInt((limit as string) || '10', 10);
    const offsetNumber = parseInt((offset as string) || '0', 10);
    const sortOrder = sortBy.toString();

    const participants = await ErrorEvent.find({
      ...(participantId && {
        participantId: participantId as string,
      }),
      ...(roomId && { roomId: roomId as string }),
      ...(startTime &&
        endTime && {
          createdAt: {
            $gte: new Date(startTime as string),
            $lt: new Date(endTime as string),
          },
        }),
    })
      .populate('roomId')
      .populate('participantId')
      .sort({ [sortOrder]: direction })
      .limit(limitNumber)
      .skip(offsetNumber);

    const totalDataCount = await ErrorEvent.find().count({
      ...(participantId && {
        participantId: participantId as string,
      }),
      ...(roomId && { roomId: roomId as string }),
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
      data: participants,
      totalDataCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
