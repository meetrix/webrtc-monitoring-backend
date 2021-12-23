import { Socket } from 'socket.io';
import logger from '../../util/logger';
export default (socket: Socket): void => {
  logger.debug('new socket connection');
  socket.on('message', () => {
    logger.debug('new message');
  });
};
