import express from 'express';

import { feedbackReport, index, usersReport, verifyAdmin } from './controller';

const router = express.Router();

router.get('/feedbacks', verifyAdmin, feedbackReport); // HTML
router.get('/feedbacks.csv', verifyAdmin, feedbackReport);
router.get('/feedbacks.json', verifyAdmin, feedbackReport);
router.post('/feedbacks', feedbackReport);

router.get('/users', usersReport); // JSON
router.post('/users', usersReport);

router.get('/', index);

export const reportsRouter = router;
