import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

mongoose.set('strictQuery', true);

export async function connectDb(uri = env.MONGO_URI) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
  });
  logger.info({ db: mongoose.connection.name }, 'mongo connected');

  mongoose.connection.on('error', (err) => logger.error({ err }, 'mongo error'));
  mongoose.connection.on('disconnected', () => logger.warn('mongo disconnected'));

  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.connection.close();
}

export default connectDb;
