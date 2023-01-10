import mongoose, { mongo } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.SESSION_SECRET = 'super_secret_key';

process.env.MONGO_DATABASE = 'test-node-api-starter';
process.env.MONGO_HOST = 'localhost';
process.env.MONGO_PORT = '27018';
process.env.MONGO_USERNAME = 'not_used';
process.env.MONGO_PASSWORD = 'not_used';

process.env.CORS_REGEX = 'not_used';

let mongod: any;

export const clearDB = async (): Promise<void> => {
  await Promise.all(
    Object.keys(mongoose.connection.collections).map(
      async (key): Promise<void> => {
        await mongoose.connection.collections[key].deleteMany({});
      }
    )
  );
};
export const initMongo = async (): Promise<void> => {
  mongod = await MongoMemoryServer.create({
    instance: {
      port: parseInt(process.env.MONGO_PORT),
      dbName: process.env.MONGO_DATABASE,
    },
  });

  if (mongoose.connection.readyState === 0) {
    const connectionURI = `${mongod.getUri()}${process.env.MONGO_DATABASE}`;
    console.log('connecting to :', connectionURI);
    await mongoose.connect(connectionURI);
  }
  await clearDB();
};
export const disconnectMongo = async (): Promise<void> => {
  await mongoose.disconnect();
  await mongod?.stop();
};
