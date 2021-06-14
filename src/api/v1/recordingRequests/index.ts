import express from 'express';

import { isAuthenticated } from '../../../middleware';
import { hasPackageOrHigher } from '../../../middleware/authorization';
import rateLimiterMiddleware from '../../../middleware/rateLimiterMemory';

import { create, init, undo, finish } from './controller';

const router = express.Router();

// Primary (PREMIUM) user generates a token which is valide for 24h
router.post('/create', [isAuthenticated, hasPackageOrHigher('PREMIUM')], create);

// Secondary user visits the link, making the link unusable again. This returns a JWT 
// to be used when recording starts and can be used for 24h after offered within the session
router.post('/init/:key', rateLimiterMiddleware, init);
// Delete previously uploaded recording
router.post('/undo', rateLimiterMiddleware, undo);
// Seal the recording request so no uploads by the secondary user is possible
router.post('/finish', rateLimiterMiddleware, finish);

export const recordingRequestRouter = router;
