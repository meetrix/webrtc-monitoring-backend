import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { SocketAuth } from '../../middleware/socketAuth';
import connectionHander from './connectionHandler';
import logger from '../../util/logger';
import { REDIS_URI } from '../secrets';
import { APP_SOCKET_PATH } from '../settings';

export default async (httpServer: HttpServer): Promise<void> => {
  const io = new SocketServer(httpServer, {
    path: APP_SOCKET_PATH,
    cors: {
      origin: true,
    },
  });
  const pubClient = createClient({
    url: REDIS_URI,
  });
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
  io.use(SocketAuth);
  io.on('connection', connectionHander);
  Promise.all([pubClient.connect(), subClient.connect()])
    .then(([]) => {
      logger.info('redis connection successful');
    })
    .catch((error) => {
      logger.error(error);
      throw error;
    });
};
