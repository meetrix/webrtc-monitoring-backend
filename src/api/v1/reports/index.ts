import express from 'express';
import cookieParser from 'cookie-parser';

import { feedbackReport, index, logout, paymentAlerts, usersReport, verifyAdmin } from './controller';
import rateLimiterMiddleware from '../../../middleware/rateLimiterMemory';

const router = express.Router();

router.use(cookieParser());

router.get('/feedbacks', verifyAdmin, feedbackReport); // HTML
router.get('/feedbacks.csv', verifyAdmin, feedbackReport);
router.get('/feedbacks.json', verifyAdmin, feedbackReport);
router.post('/feedbacks', rateLimiterMiddleware, feedbackReport);

router.get('/users', verifyAdmin, usersReport); // JSON
router.post('/users', rateLimiterMiddleware, usersReport);

router.get('/payments/alerts', paymentAlerts);

router.get('/logout', verifyAdmin, logout);

router.get('/', rateLimiterMiddleware, index);

export const reportsRouter = router;
