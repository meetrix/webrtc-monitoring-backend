import stdio from 'stdio';
import { setupMongoose } from '../src/config/mongoose';
import logger from '../src/util/logger';
import { signPluginToken } from '../src/util/auth';
import { Plugin } from '../src/models/Plugin';
import { SESSION_SECRET } from '../src/config/secrets';
import { MONGO_URI } from '../src/config/secrets';

interface Options {
  domain: string;
}

const getToken = async (): Promise<void> => {
  logger.info('get token for plugin');
  try {
    const { domain = 'meetrix.io', validity = '48h' } = stdio.getopt({
      domain: { key: 'd', args: 1, description: 'domain', required: true },
      validity: { key: 'v', args: 1, description: 'role', required: false },
    });
    await setupMongoose(MONGO_URI);
    const plugin = await Plugin.findOne({ domain } as { domain: string });

    if (!plugin) throw new Error('Plugin not found');

    const token = signPluginToken(plugin, SESSION_SECRET, validity as string);
    logger.info(`plugin toke for domain ${domain}: ${token}`);
    process.exit(0);
  } catch (error) {
    logger.error('Failed to generate token for plugin');
    logger.error(error);
    process.exit(1);
  }
};

getToken();
