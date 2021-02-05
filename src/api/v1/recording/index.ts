import express from 'express';

import rateLimiterMiddleware from '../../../middleware/rateLimiterMemory';

import { trackRecording } from './controller';

const router = express.Router();

router.post('/', rateLimiterMiddleware, trackRecording);

export const recordingRouter = router;
