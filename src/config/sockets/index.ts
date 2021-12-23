import { Server } from 'socket.io';
import connectionHander from './connectionHandler';

export default (io: Server): void => {
  io.on('connection', connectionHander);
};
