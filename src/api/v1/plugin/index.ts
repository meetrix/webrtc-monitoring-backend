import express from 'express';

import { isAuthenticated } from '../../../middleware';
import { isPluginUser } from '../../../middleware/authorization';
import rateLimiterMiddleware from '../../../middleware/rateLimiterMemory';

import { setup, getPlugin, init } from './controller';

const router = express.Router();

router.post('/setup', [isAuthenticated, isPluginUser], setup);
router.get('/setup', [isAuthenticated, isPluginUser], getPlugin);

router.get('/init/:key', rateLimiterMiddleware, init);

export const pluginRouter = router;
