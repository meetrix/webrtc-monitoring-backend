import { createClient } from 'redis';
import { REDIS_URI } from '../../config/secrets';
import logger from '../logger';

export type RedisClientType = ReturnType<typeof createClient>;

let staticClient: RedisClientType;

export const getNewClient = async (): Promise<RedisClientType> => {
  const redis: RedisClientType = createClient({ url: REDIS_URI });
  try {
    await redis.connect();
    logger.info('a new redis client created');
    return redis;
  } catch (error) {
    logger.error('failed to connect to redis ', error);
    throw error;
  }
};

export const getStaticClient = async (): Promise<RedisClientType> => {
  if (!staticClient) {
    staticClient = await getNewClient();
  }
  return staticClient;
};
