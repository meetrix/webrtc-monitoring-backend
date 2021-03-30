import express from 'express';

import { isAuthenticated } from '../../../middleware';
import { hasPackageOrHigher } from '../../../middleware/authorization';
import rateLimiterMiddleware from '../../../middleware/rateLimiterMemory';

import { setup, getPlugin, init } from './controller';

const router = express.Router();

router.post('/setup', [isAuthenticated, hasPackageOrHigher('PREMIUM', 'active')], setup);
router.get('/setup', [isAuthenticated, hasPackageOrHigher('PREMIUM', 'inactive')], getPlugin);

router.get('/init/:key', rateLimiterMiddleware, init);

export const pluginRouter = router;
