import mongoose from 'mongoose';
import logger from '../util/logger';

export const setupMongoose = async (mongoURI: string): Promise<void> => {
  await mongoose.connect(mongoURI).catch((err): void => {
    logger.error(
      'MongoDB connection error. Please make sure MongoDB is running. ' + err
    );
    process.exit(1);
  });
};
