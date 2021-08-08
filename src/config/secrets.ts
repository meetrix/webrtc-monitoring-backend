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

  'GOOGLE_ID',
  'GOOGLE_SECRET',

  'LINKEDIN_API_KEY',
  'LINKEDIN_SECRET',

  'FACEBOOK_ID',
  'FACEBOOK_SECRET',

  'AWS_ACCESS_KEY',
  'AWS_ACCESS_KEY_SECRET',

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

const mongoURI =
  NODE_ENV === PRODUCTION || NODE_ENV === STAGING
    ? `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}?authSource=admin`
    : `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}`;

export const SESSION_SECRET = process.env['SESSION_SECRET'];
export const MONGO_URI = mongoURI;
export const FACEBOOK_ID = process.env['FACEBOOK_ID'];
export const FACEBOOK_SECRET = process.env['FACEBOOK_SECRET'];

export const LINKEDIN_API_KEY = process.env['LINKEDIN_API_KEY'];
export const LINKEDIN_SECRET = process.env['LINKEDIN_SECRET'];

export const GOOGLE_ID = process.env['GOOGLE_ID'];
export const GOOGLE_SECRET = process.env['GOOGLE_SECRET'];
export const AWS_ACCESS_KEY = process.env['AWS_ACCESS_KEY'];
export const AWS_ACCESS_KEY_SECRET = process.env['AWS_ACCESS_KEY_SECRET'];
export const SMTP_HOST = process.env['SMTP_HOST'];

export const SMTP_USER = process.env['SMTP_USER'];

export const SMTP_PASSWORD = process.env['SMTP_PASSWORD'];

export const CORS_REGEX = process.env['CORS_REGEX'];
