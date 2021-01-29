import express from 'express';

import { feedbackReport, index } from './controller';

const router = express.Router();

router.use('/feedbacks', feedbackReport);
router.use('/', index);

export const reportsRouter = router;
