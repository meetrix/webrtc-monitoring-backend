import { Server } from 'socket.io';
import {
  SOCKET_CLIENT_JOINED,
  SOCKET_CLIENT_LEFT,
  ClientType,
  ResponseType,
} from '@meetrix/webrtc-monitoring-common-lib';
import logger from '../../../util/logger';
import {
  addActivePluginClient,
  removePluginClient,
} from '../../../util/redis/plugins';
import {
  socketPluginAuth,
  SocketWithPluginAuthType,
} from '../../../middleware/socket/socketAuth';
import { APP_SOCKET_CLIENT_SPACE, APP_SOCKET_USER_SPACE } from '../../settings';

export default async (io: Server): Promise<void> => {
  const clientSpace = io.of(APP_SOCKET_CLIENT_SPACE);
  const userSpace = io.of(APP_SOCKET_USER_SPACE);
  clientSpace.use(socketPluginAuth);
  clientSpace.on('connection', (socket: SocketWithPluginAuthType) => {
    const { domain, clientId } = socket.auth;
    logger.info(
      `plugin with domain: ${domain}, socketId: ${socket.id}, clientId: ${clientId} connected`
    );
    const room = socket.auth.clientId as string;
    addActivePluginClient({
      domain,
      clientId,
    });
    userSpace.to(domain).emit(SOCKET_CLIENT_JOINED, {
      clientId,
      domain,
    });
    socket.on('report', (data) => {
      io.to(room).emit('report', data);
    });
    socket.on('disconnect', () => {
      removePluginClient({
        domain,
        clientId,
      });
      userSpace.to(domain).emit(SOCKET_CLIENT_LEFT, {
        clientId,
        domain,
      });
    });
  });
};
