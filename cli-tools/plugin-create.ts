import stdio from 'stdio';
import { setupMongoose } from '../src/config/mongoose';
import { registerPlugin } from '../test/helpers';
import logger from '../src/util/logger';
import { MONGO_URI } from '../src/config/secrets';

interface Options {
  email: string;
  domain: string;
}

const createPlugin = async (): Promise<void> => {
  logger.info('create plugin');
  try {
    const { email = 'dev@meetrix.io', domain = 'dev.meetrix.io' } =
      stdio.getopt({
        email: {
          key: 'e',
          args: 1,
          description: 'email of the owner ',
          required: true,
        },
        domain: {
          key: 'd',
          args: 1,
          description: 'domain name for the plugin (eg: meetrix.io)',
        },
      });
    await setupMongoose(MONGO_URI);
    await registerPlugin({
      email,
      domain,
    } as Options);
    logger.info(`plugin registered. user: ${email}, domain: ${domain}`);
    process.exit(0);
  } catch (error) {
    logger.error('Failed to register plugin');
    logger.error(error);
    process.exit(1);
  }
};

createPlugin();
