import dotenv from 'dotenv';
dotenv.config();

export const NODE_ENV = process.env.NODE_ENV;
export const PRODUCTION = 'production';
export const STAGING = 'staging';
export const TEST = 'test';
export const JWT_EXPIRATION = '7d';
export const JWT_EXPIRATION_PLUGIN = '2h';
export const JWT_EXPIRATION_REC_REQ = '365d'; // TODO-> change to one day (1d)
export const APP_PORT = 9100;
export const UNSUBSCRIBE_LANDING = '';
export const CONFIRMATION_LANDING =
  'https://screenapp.io/auth';
export const RECOVERY_LANDING =
  'https://screenapp.io/auth';
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
export const S3_USER_META_BUCKET = process.env['USER_META_BUCKET'];
export const S3_USER_RECORDINGS_BUCKET = process.env['USER_RECORDINGS_BUCKET'];
export const RECEIVER_EMAIL = process.env['RECEIVER_EMAIL'] || 'support@screenapp.io';
export const SENDER_EMAIL = process.env['SENDER_EMAIL'] || 'hello@screenapp.io';
export const S3_CONTENT_LINK_EXPIRATION = 15 * 60; // 15 min
export const STRIPE_SECRET_KEY = process.env['STRIPE_SECRET_KEY'];
export const STRIPE_STANDARD_PRICE_ID = process.env['STRIPE_STANDARD_PRICE_ID'];
export const STRIPE_PREMIUM_PRICE_ID = process.env['STRIPE_PREMIUM_PRICE_ID'];
export const STRIPE_STANDARD_MONTHLY_PRICE_ID = process.env['STRIPE_STANDARD_MONTHLY_PRICE_ID'];
export const STRIPE_PREMIUM_MONTHLY_PRICE_ID = process.env['STRIPE_PREMIUM_MONTHLY_PRICE_ID'];
export const STRIPE_FREE_PRICE_ID = process.env['STRIPE_FREE_PRICE_ID'];
export const STRIPE_WEBHOOK_SECRET = process.env['STRIPE_WEBHOOK_SECRET'];

export const PAYPAL_REST_API_URL = process.env['PAYPAL_REST_API_URL'];
export const PAYPAL_CLIENT_ID = process.env['PAYPAL_CLIENT_ID'];
export const PAYPAL_CLIENT_SECRET = process.env['PAYPAL_CLIENT_SECRET'];
export const PAYPAL_FREE_PLAN_ID = process.env['PAYPAL_FREE_PLAN_ID'];
export const PAYPAL_STANDARD_PLAN_ID = process.env['PAYPAL_STANDARD_PLAN_ID'];
export const PAYPAL_PREMIUM_PLAN_ID = process.env['PAYPAL_PREMIUM_PLAN_ID'];
export const PAYPAL_STANDARD_TRIAL_PLAN_ID = process.env['PAYPAL_STANDARD_TRIAL_PLAN_ID'];
export const PAYPAL_PREMIUM_TRIAL_PLAN_ID = process.env['PAYPAL_PREMIUM_TRIAL_PLAN_ID'];
export const PAYPAL_STANDARD_MONTHLY_PLAN_ID = process.env['PAYPAL_STANDARD_MONTHLY_PLAN_ID'];
export const PAYPAL_PREMIUM_MONTHLY_PLAN_ID = process.env['PAYPAL_PREMIUM_MONTHLY_PLAN_ID'];
export const PAYPAL_STANDARD_MONTHLY_TRIAL_PLAN_ID = process.env['PAYPAL_STANDARD_MONTHLY_TRIAL_PLAN_ID'];
export const PAYPAL_PREMIUM_MONTHLY_TRIAL_PLAN_ID = process.env['PAYPAL_PREMIUM_MONTHLY_TRIAL_PLAN_ID'];
