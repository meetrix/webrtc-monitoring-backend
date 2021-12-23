import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import logger from './util/logger';
import configSockets from './config/sockets';

const httpServer = createServer(app);
const io = new Server(httpServer);
configSockets(io);

httpServer.listen(app.get('port'), (): void => {
  logger.info(
    `App is running at http://localhost:${app.get(
      'port'
    )}/v1/spec/ in ${app.get('env')} mode`
  );
});
export default httpServer;
