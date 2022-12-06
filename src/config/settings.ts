import dotenv from 'dotenv';
if (process.env.NODE_ENV === 'TEST') {
  dotenv.config({ path: '../.env.test' });
} else {
  dotenv.config();
}

export const NODE_ENV = process.env.NODE_ENV;
export const PRODUCTION = 'production';
export const STAGING = 'staging';
export const TEST = 'test';
export const JWT_EXPIRATION = '7d';
export const JWT_EXPIRATION_PLUGIN = '2h';
export const JWT_EXPIRATION_REC_REQ = '365d'; // TODO-> change to one day (1d)
export const APP_PORT = 9100;

export const APP_SOCKET_PATH = '/stats';

export const APP_SOCKET_CLIENT_SPACE = '/clients';

export const APP_SOCKET_USER_SPACE = '/users';

// Redis

export const APP_REDIS_PLUGINS_CLIENT_IDS_ACTIVE = 'plugins:client_ids:active';
export const UNSUBSCRIBE_LANDING = '';
export const CONFIRMATION_LANDING = 'https://screenapp.io/auth';
export const RECOVERY_LANDING = 'https://screenapp.io/auth';
export const AUTH_LANDING = process.env['AUTH_LANDING'];
export const API_BASE_URL = process.env['API_BASE_URL'];
export const SUPPORT_URL = process.env['SUPPORT_URL'];

export const GOOGLE_CALLBACK_URL = process.env['GOOGLE_CALLBACK_URL'];
export const FACEBOOK_CALLBACK_URL = process.env['FACEBOOK_CALLBACK_URL'];
export const LINKEDIN_CALLBACK_URL = process.env['LINKEDIN_CALLBACK_URL'];
export const USER_ROLES = ['user', 'admin', 'owner'];
export const USER_PACKAGES = ['FREE_LOGGEDIN', 'STANDARD', 'PREMIUM'];
export const SUBSCRIPTION_STATUSES = ['pending', 'inactive', 'active']; // DO NOT CHANGE THE ORDER
export const S3_CONTENT_BUCKET = 'starter-content';
export const RECEIVER_EMAIL =
  process.env['RECEIVER_EMAIL'] || 'support@meetrix.io';
export const SENDER_EMAIL = process.env['SENDER_EMAIL'] || 'hello@meetrix.io';
export const S3_CONTENT_LINK_EXPIRATION = 15 * 60; // 15 min
