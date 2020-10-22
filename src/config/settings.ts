import dotenv from 'dotenv';
dotenv.config();

export const NODE_ENV = process.env.NODE_ENV;
export const PRODUCTION = 'production';
export const TEST = 'test';
export const JWT_EXPIRATION = '7d';
export const APP_PORT = 9100;
export const UNSUBSCRIBE_LANDING = '';
export const CONFIRMATION_LANDING =
  'https://screenapp.io/auth';
export const RECOVERY_LANDING =
  'https://screenapp.io/auth';
export const AUTH_LANDING = process.env['AUTH_LANDING'];
export const API_BASE_URL = process.env['API_BASE_URL'];
export const USER_ROLES = ['user', 'admin', 'owner'];
export const USER_PACKAGES = ['FREE_LOGGEDIN', 'STANDARD', 'PREMIUM'];
export const S3_CONTENT_BUCKET = 'starter-content';
export const RECEIVER_EMAIL = process.env['RECEIVER_EMAIL'] || 'manoranjana@ieee.org';
export const SENDER_EMAIL = process.env['SENDER_EMAIL'] || 'hello@screenapp.io';
export const S3_CONTENT_LINK_EXPIRATION = 15 * 60; // 15 min

