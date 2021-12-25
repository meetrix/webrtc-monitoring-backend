import stdio from 'stdio';
import { setupMongoose } from '../src/config/mongoose';
import logger from '../src/util/logger';
import { signToken } from '../src/util/auth';
import { User } from '../src/models/User';
import { SESSION_SECRET } from '../src/config/secrets';
import { MONGO_URI } from '../src/config/secrets';

interface Options {
  email: string;
  validity: string;
}

const getToken = async (): Promise<void> => {
  logger.info('create admin');
  try {
    const { email = 'admin@clientify.io', validity = '48h' } = stdio.getopt({
      email: { key: 'e', args: 1, description: 'email', required: true },
      validity: { key: 'v', args: 1, description: 'role', required: false },
    });
    await setupMongoose(MONGO_URI);
    const user = await User.findOne({ email } as { email: string });

    if (!user || user.email !== email) throw new Error('User not found');

    const token = signToken(user, SESSION_SECRET, validity as string);
    logger.info(`token: ${token}`);
    process.exit(0);
  } catch (error) {
    logger.error('Failed to generate token');
    logger.error(error);
    process.exit(1);
  }
};

getToken();
