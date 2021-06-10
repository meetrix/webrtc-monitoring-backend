import express from 'express';

import { isAuthenticated } from '../../../middleware';
import { hasPackageOrHigher } from '../../../middleware/authorization';
import rateLimiterMiddleware from '../../../middleware/rateLimiterMemory';

import { create, init, undo, finish } from './controller';

const router = express.Router();

router.post('/create', [isAuthenticated, hasPackageOrHigher('PREMIUM')], create);

router.get('/init/:key', rateLimiterMiddleware, init);
router.post('/undo', rateLimiterMiddleware, undo);
router.post('/finish', rateLimiterMiddleware, finish);

export const recordingRequestRouter = router;
