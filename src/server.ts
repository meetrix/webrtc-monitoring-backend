import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import logger from './util/logger';

const httpServer = createServer(app);
const io = new Server(httpServer);

httpServer.listen(app.get('port'), (): void => {
  logger.info(
    `App is running at http://localhost:${app.get('port')} in ${app.get(
      'env'
    )} mode`
  );
});
export default httpServer;
