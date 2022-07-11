import stdio from 'stdio';
import { setupMongoose } from '../src/config/mongoose';
import logger from '../src/util/logger';
import { Plugin } from '../src/models/Plugin';
import { IceServerConfig } from '../src/models/ICEServerConfig';
import { MONGO_URI } from '../src/config/secrets';

interface Options {
  domain: string;
}

const defaultIceServers = JSON.stringify({
  mode: 'static',
  iceServers: [
    {
      username: 'user',
      credential: 'asdfasdf',
      urls: ['turn:127.0.0.1:3478?transport=tcp'],
    },
  ],
});

const setIceServers = async (): Promise<void> => {
  logger.info('set ice servers for plugin');
  try {
    const { domain = 'meetrix.io', iceServers = defaultIceServers } =
      stdio.getopt({
        domain: { key: 'd', args: 1, description: 'domain', required: true },
        iceServers: {
          key: 's',
          args: 1,
          description: 'ice-servers',
          required: false,
          default: defaultIceServers,
        },
      }) as any;
    await setupMongoose(MONGO_URI);
    const plugin = await Plugin.findOne({ domain } as { domain: string });

    if (!plugin) throw new Error('Plugin not found');

    const iceConfig = JSON.parse(iceServers);
    let config = await IceServerConfig.findOne({
      pluginId: plugin.id,
    });
    if (!config) {
      config = new IceServerConfig({
        ownerId: plugin.ownerId,
        pluginId: plugin.id,
      });
    } else if (config.mode !== iceConfig.mode) {
      await config.delete();
      config = new IceServerConfig({
        ownerId: plugin.ownerId,
        pluginId: plugin.id,
      });
    }

    config.set(iceConfig);
    await config.save();
    logger.info(`ICE Servers set for ${plugin._id}: ${iceServers}`);
    process.exit(0);
  } catch (error) {
    logger.error('Failed to set ice servers for plugin');
    logger.error(error);
    process.exit(1);
  }
};

setIceServers();
