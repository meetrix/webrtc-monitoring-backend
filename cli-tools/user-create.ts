import stdio from 'stdio';
import { setupMongoose } from '../src/config/mongoose';
import { registerValidUser } from '../test/helpers';
import logger from '../src/util/logger';
import { MONGO_URI } from '../src/config/secrets';

interface Options {
  email: string;
  password: string;
  role: 'user' | 'admin' | 'owner';
}

const createAdmin = async (): Promise<void> => {
  logger.info('create admin');
  try {
    const {
      email = 'admin@clientify.io',
      password = 'admin',
      role = 'user',
    } = stdio.getopt({
      email: { key: 'e', args: 1, description: 'email', required: true },
      password: { key: 'p', args: 1, description: 'password' },
      role: { key: 'r', args: 1, description: 'role (user, admin, owner)' },
    });
    await setupMongoose(MONGO_URI);
    await registerValidUser({
      email,
      password,
      role,
    } as Options);
    logger.info(`user created. email: ${email}, role: ${role}`);
    process.exit(0);
  } catch (error) {
    logger.error('Failed to create user');
    logger.error(error);
    process.exit(1);
  }
};

createAdmin();
