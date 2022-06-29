import jwt from 'jsonwebtoken';
import { RequestHandler, NextFunction, Request, Response } from 'express';

import logger from '../util/logger';
import { SESSION_SECRET } from '../config/secrets';
import { USER_ROLES } from '../config/settings';
import { formatError } from '../util/error';
import { User } from '../models/User';
import { Plugin } from '../models/Plugin';

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
      res.sendStatus(401);
      return;
    }
    const token = req.headers.authorization.split('Bearer ')[1];
    let jwtInfo;

    try {
      jwtInfo = jwt.verify(token, SESSION_SECRET) as Express.JwtUser;
    } catch (error) {
      logger.error(error);
      res.sendStatus(401);
      return;
    }

    // Reject *plugin* authentication tokens
    if ((jwtInfo as Express.IJwtUser as Express.JwtPluginUser)?.plugin) {
      throw new Error('Plugin authentication tokens cannot be used to log-in.');
    }

    const userDoc = await User.findOne({ email: jwtInfo.email });
    if (!userDoc) {
      res.sendStatus(401);
      return;
    }
    req.user = userDoc;

    next();
  } catch (error) {
    logger.error(error);
    res.status(401).json({
      success: false,
      error: 'unauthorized',
    });
  }
};

export const hasRoleOrHigher = (level: string): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.headers.authorization) {
        res.sendStatus(401);
        console.log('Role: No auth', req.path);
        return;
      }
      const token = req.headers.authorization.split('Bearer ')[1];
      const { email } = jwt.verify(token, SESSION_SECRET) as Express.User;
      if (!email) {
        res.sendStatus(403);
        console.log('Role: No email', req.path);
        return;
      }

      const user = await User.findOne({ email });
      if (!user?.id) {
        res.sendStatus(403);
        console.log('Role: No user', req.path, email);
        return;
      }

      req.user = user;
      if (USER_ROLES.indexOf(req.user.role) >= USER_ROLES.indexOf(level)) {
        next();
      } else {
        res.sendStatus(403);
        console.log('Role: No permissions', req.path, user);
      }
    } catch (error) {
      logger.error(error);
      res.sendStatus(401);
    }
  };
};

/**
 * Allows using a plugin for both the owner and the user
 * @returns
 */
export const isPluginOwnerOrUser = (): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.headers.authorization) {
        res.sendStatus(401);
        console.log('Plugin: No auth', req.path);
        return;
      }
      const token = req.headers.authorization.split('Bearer ')[1];
      const result = jwt.verify(token, SESSION_SECRET) as Express.IJwtUser;
      const isPluginToken = Boolean((result as Express.JwtPluginUser).plugin);
      const pluginId =
        req.params.id || (result as Express.JwtPluginUser).plugin || '';

      // Load default plugin if no plugin is specified
      const plugin = pluginId
        ? await Plugin.findById(pluginId)
        : await Plugin.findOne({
            ownerId: result.sub,
            revoked: false,
          });
      if (!plugin?.id) {
        res.status(404).json({ success: false, error: 'App token not found.' });
        console.log('Plugin: No plugin', req.path);
        return;
      }
      req.params.id = plugin.id;

      if (isPluginToken) {
        if (plugin.revoked) {
          res
            .status(404)
            .json({ success: false, error: 'App token not found.' });
          console.log('Plugin: Revoked plugin', req.path);
          return;
        }
        req.user = null;
        next();
      } else {
        // User token
        const user = await User.findById(result.sub);
        if (!user?.id) {
          res.status(404).json({ success: false, error: 'Account not found.' });
          console.log('Plugin: No user', req.path, result);
          return;
        }
        if (plugin.ownerId !== user.id) {
          res
            .status(403)
            .json({ success: false, error: 'Forbidden: not your token.' });
          console.log('Plugin: No permissions', req.path, user.email);
          return;
        }

        req.user = user;
        next();
      }
    } catch (error) {
      logger.error(error);
      res.sendStatus(401);
    }
  };
};

/**
 * Allows using a plugin for a user
 * @returns
 */
export const isPluginUser = (): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.headers.authorization) {
        res
          .status(401)
          .json({ success: false, error: 'No authentication token provided.' });
        console.log('Plugin: No auth', req.path);
        return;
      }
      const token = req.headers.authorization.split('Bearer ')[1];
      const result = jwt.verify(token, SESSION_SECRET) as Express.IJwtUser;

      const isPluginToken = Boolean((result as Express.JwtPluginUser).plugin);
      if (!isPluginToken) {
        res.status(403).json({ success: false, error: 'Invalid token' });
        console.log('Plugin: Invalid token', req.path);
        return;
      }
      const pluginId =
        req.params.id || (result as Express.JwtPluginUser).plugin || '';
      // Load default plugin if no plugin is specified
      const plugin = pluginId
        ? await Plugin.findById(pluginId)
        : await Plugin.findOne({
            ownerId: result.sub,
            // revoked: false, // Doesn't matter if the plugin is revoked
          });
      if (!plugin?.id) {
        res.status(401).json({ success: false, error: 'App token not found.' });
        console.log('Plugin: No plugin', req.path);
        return;
      }
      if (plugin.revoked) {
        res
          .status(403)
          .json({ success: false, error: 'App token is expired.' });
        console.log('Plugin: Revoked', req.path);
        return;
      }
      req.body.clientId = req.headers['x-client-id'];
      req.body.pluginId = plugin.id;
      req.body.ownerId = plugin.ownerId;
      req.user = null;

      next();
    } catch (error) {
      console.log(error);
      res.status(401).json({ success: false, error: 'Authentication error.' });
    }
  };
};
