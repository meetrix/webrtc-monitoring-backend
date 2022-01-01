import { Socket } from 'socket.io';
import logger from '../../util/logger';
import { verify } from '../../util/auth';
import { PluginTokenInformation, UserTokenInformation } from '../../types/app';
import { User, UserDocument } from '../../models/User';

export interface PluginQueryInformation {
  clientId: string;
}
export interface SocketWithPluginAuthType extends Socket {
  auth?: PluginTokenInformation & PluginQueryInformation;
}

export interface SocketWithUserAuthType extends Socket {
  auth: UserTokenInformation;
  user: UserDocument;
}

export const socketPluginAuth = async (
  socket: SocketWithPluginAuthType,
  next: (err?: Error) => void
): Promise<void> => {
  if (socket.handshake.auth && socket.handshake.auth.token) {
    try {
      const decodedToken = await verify<PluginTokenInformation>(
        socket.handshake.auth.token as string
      );
      const clientId = socket?.handshake?.query?.clientId as string;
      if (!decodedToken) {
        throw new Error(
          `decodedToken not provided decodedToken: ${decodedToken}`
        );
      }
      if (!clientId) {
        throw new Error(`clientId not provided clientId: ${clientId}`);
      }
      socket.auth = {
        ...decodedToken,
        clientId,
      };
      logger.info(`plugin socket authenticated domain: ${decodedToken.domain}`);

      // const user = await User.findOne({ email: decodedToken.email });
      // socket.user = user;
      next();
    } catch (error) {
      logger.error(`socket authentication failed: `, error);
      next(new Error('Authentication error'));
    }
  } else {
    next(new Error('Authentication error'));
  }
};

export const socketUserAuth = async (
  socket: SocketWithUserAuthType,
  next: (err?: Error) => void
): Promise<void> => {
  if (socket.handshake.auth && socket.handshake.auth.token) {
    try {
      const decodedToken = await verify<UserTokenInformation>(
        socket.handshake.auth.token as string
      );
      socket.auth = decodedToken;
      logger.info(`user socket authenticated email: ${decodedToken.email}`);

      const user = await User.findOne({ email: decodedToken.email });
      socket.user = user;
      next();
    } catch (error) {
      logger.error(`socket authentication failed: `, error);
      next(new Error('Authentication error'));
    }
  } else {
    next(new Error('Authentication error'));
  }
};
