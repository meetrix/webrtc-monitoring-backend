import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import handleClientSpace from './clients';
import handleUserSpace from './users';
import { getNewClient } from '../../util/redis';
import { APP_SOCKET_PATH } from '../settings';

export default async (httpServer: HttpServer): Promise<void> => {
  const io = new SocketServer(httpServer, {
    path: APP_SOCKET_PATH,
    cors: {
      origin: false,
    },
  });
  const pubClient = await getNewClient();
  const subClient = await getNewClient();
  io.adapter(createAdapter(pubClient, subClient));

  // plugin space
  handleClientSpace(io);

  // user space
  handleUserSpace(io);
};
