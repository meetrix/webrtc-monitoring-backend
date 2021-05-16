import express from 'express';
import cookieParser from 'cookie-parser';

import {
  feedbackReport,
  index,
  logout,
  paymentAlerts,
  usageReport,
  verifyAdmin,
  users,
  events,
} from './controller';
import rateLimiterMiddleware from '../../../middleware/rateLimiterMemory';

const router = express.Router();

router.use(cookieParser());

router.get('/feedbacks', verifyAdmin, feedbackReport); // HTML
router.get('/feedbacks.csv', verifyAdmin, feedbackReport);
router.get('/feedbacks.json', verifyAdmin, feedbackReport);
router.post('/feedbacks', rateLimiterMiddleware, feedbackReport);

router.get('/usage', verifyAdmin, usageReport); // JSON
router.post('/usage', rateLimiterMiddleware, usageReport);

router.get('/users', users); // JSON
router.get('/events', events); // JSON

router.get('/payments/alerts', verifyAdmin, paymentAlerts);
router.post('/payments/alerts', rateLimiterMiddleware, paymentAlerts);

router.get('/logout', verifyAdmin, logout);

router.get('/', rateLimiterMiddleware, index);

export const reportsRouter = router;
