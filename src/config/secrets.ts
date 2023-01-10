import dotenv from 'dotenv';
import fs from 'fs';
import { NODE_ENV, PRODUCTION, STAGING } from './settings';
import logger from '../util/logger';

if (!fs.existsSync('.env')) {
  logger.info('No .env file found, looking for variables in environment.');
}

dotenv.config();

const requiredSecrets = [
  'SESSION_SECRET',

  'MONGO_DATABASE',
  'MONGO_HOST',
  'MONGO_PORT',

  // 'REDIS_HOST',
  // 'REDIS_PORT',

  'CORS_REGEX',
];

if (NODE_ENV === PRODUCTION || NODE_ENV === STAGING) {
  requiredSecrets.push(...['MONGO_USERNAME', 'MONGO_PASSWORD']);
}

const missingSecrets = requiredSecrets.filter((s) => !process.env[s]);
if (missingSecrets.length > 0) {
  missingSecrets.forEach((ms) =>
    logger.error(`Env variable ${ms} is missing.`)
  );
  process.exit(1);
}

export const MONGO_URI =
  NODE_ENV === PRODUCTION || NODE_ENV === STAGING
    ? `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}?authSource=admin`
    : `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}`;

// export const REDIS_URI = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

export const SESSION_SECRET = process.env['SESSION_SECRET'];
export const SMTP_HOST = process.env['SMTP_HOST'];

export const SMTP_USER = process.env['SMTP_USER'];

export const SMTP_PASSWORD = process.env['SMTP_PASSWORD'];

export const CORS_REGEX = process.env['CORS_REGEX'];
