import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import connectionHander from './connectionHandler';
import logger from '../../util/logger';
import { REDIS_URI } from '../secrets';

export default async (io: Server): Promise<void> => {
  const pubClient = createClient({
    url: REDIS_URI,
  });
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
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
