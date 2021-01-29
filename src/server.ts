import app from './app';
import handleWebSocketEvents from './ws';
import logger from './util/logger';

const server = app.listen(app.get('port'), (): void => {
  logger.info(
    `App is running at http://localhost:${app.get('port')} in ${app.get(
      'env'
    )} mode`
  );
});

handleWebSocketEvents(server);

export default server;
