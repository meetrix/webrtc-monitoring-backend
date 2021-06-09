import express from 'express';

import { isAuthenticated } from '../../../middleware';
import { hasPackageOrHigher } from '../../../middleware/authorization';
import rateLimiterMiddleware from '../../../middleware/rateLimiterMemory';

import { create, init, finish } from './controller';

const router = express.Router();

router.post('/create', [isAuthenticated, hasPackageOrHigher('PREMIUM')], create);

router.get('/init/:key', rateLimiterMiddleware, init);
// router.post('/undo/:key', rateLimiterMiddleware, undo);
router.get('/finish/:key', rateLimiterMiddleware, finish);

export const recordingRequestRouter = router;
