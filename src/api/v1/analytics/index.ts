import express from 'express';

import { track } from './controller';

const router = express.Router();

// TODO Add a (lenient) rate limiter
router.post('/', track);

export const analyticsRouter = router;
