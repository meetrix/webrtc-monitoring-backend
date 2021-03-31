import jwt from 'jsonwebtoken';
import { RequestHandler, NextFunction, Request, Response } from 'express';

import logger from '../util/logger';
import { SESSION_SECRET } from '../config/secrets';
import { USER_ROLES } from '../config/settings';
import { formatError } from '../util/error';
import { User } from '../models/User';

export const handleErrors = (
  error: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  logger.error(error.stack);
  res.status(500).json(formatError('Server Error'));
};

export const handleMissing = (_req: Request, res: Response): void => {
  res.sendStatus(404);
};

/**
 * Main authenticator middleware. This rejects plugin authentication tokens. 
 * 
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.headers.authorization) {
      res.status(401).json({
        success: false,
        error: 'unauthorized'
      });
      return;
    }
    const token = req.headers.authorization.split('Bearer ')[1];
    const jwtInfo = jwt.verify(token, SESSION_SECRET) as Express.JwtUser;

    // Reject *plugin* authentication tokens
    if ((jwtInfo as Express.IJwtUser as Express.JwtPluginUser).plugin) {
      throw new Error('Plugin authentication tokens cannot be used to log-in.');
    }

    const userDoc = await User.findOne({ _id: jwtInfo.sub });
    if (!userDoc) {
      throw Error('user not found');
    }
    req.user = userDoc;

    next();
  } catch (error) {
    logger.error(error);
    res.status(401).json({
      success: false,
      error: 'unauthorized'
    });
  }
};

export const hasRoleOrHigher = (level: string): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.headers.authorization) {
        res.sendStatus(401);
        return;
      }
      const token = req.headers.authorization.split('Bearer ')[1];
      req.user = jwt.verify(token, SESSION_SECRET) as Express.User;
      if (
        USER_ROLES.indexOf(req.user.role) >= USER_ROLES.indexOf(level)
      ) {
        next();
      } else {
        res.sendStatus(403);
      }
    } catch (error) {
      logger.error(error);
      res.sendStatus(401);
    }
  };
};
