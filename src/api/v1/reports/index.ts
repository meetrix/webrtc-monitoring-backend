import express from 'express';
import cookieParser from 'cookie-parser';

import { feedbackReport, index, logout, usersReport, verifyAdmin } from './controller';

const router = express.Router();

router.use(cookieParser());

router.get('/feedbacks', verifyAdmin, feedbackReport); // HTML
router.get('/feedbacks.csv', verifyAdmin, feedbackReport);
router.get('/feedbacks.json', verifyAdmin, feedbackReport);
router.post('/feedbacks', feedbackReport);

router.get('/users', verifyAdmin, usersReport); // JSON
router.post('/users', usersReport);

router.get('/logout', verifyAdmin, logout);

router.get('/', index);

export const reportsRouter = router;
