import { Server } from 'socket.io';
import logger from '../../../util/logger';
import {
  socketUserAuth,
  SocketWithUserAuthType,
} from '../../../middleware/socket/socketAuth';
import { SOCKET_ROOM_JOIN } from '@meetrix/webrtc-monitoring-common-lib';
import { APP_SOCKET_USER_SPACE } from '../../settings';
import { Plugin } from '../../../models/Plugin';
export default (io: Server): void => {
  const userSpace = io.of(APP_SOCKET_USER_SPACE);
  userSpace.use(socketUserAuth);
  userSpace.on('connection', async (socket: SocketWithUserAuthType) => {
    logger.info(`socketId: ${socket.id} of ${socket.user.email} connected`);
    const plugins = await Plugin.find({
      ownerId: socket.user.id,
    });
    plugins.forEach((plugin) => {
      socket.join(plugin.domain);
    });
    socket.on(SOCKET_ROOM_JOIN, (data: any) => {
      const { room } = data;
      if (room) {
        socket.join(room);
      }
    });
  });
};
