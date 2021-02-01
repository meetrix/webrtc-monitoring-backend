import express from 'express';

import { feedbackReport, index, verifyAdmin } from './controller';

const router = express.Router();

router.get('/feedbacks', verifyAdmin, feedbackReport);
router.post('/feedbacks', feedbackReport);
router.get('/', index);

export const reportsRouter = router;
