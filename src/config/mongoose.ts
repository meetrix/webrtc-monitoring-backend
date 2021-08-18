import mongoose from 'mongoose';
import logger from '../util/logger';

export const setupMongoose = async (mongoURI: string): Promise<void> => {
  mongoose.set('useNewUrlParser', true);
  mongoose.set('useCreateIndex', true);
  mongoose.set('useUnifiedTopology', true);

  await mongoose.connect(mongoURI).catch((err): void => {
    logger.error(
      'MongoDB connection error. Please make sure MongoDB is running. ' + err
    );
    process.exit(1);
  });
};
