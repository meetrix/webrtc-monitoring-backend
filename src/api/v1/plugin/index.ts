import express from 'express';

import { isAuthenticated } from '../../../middleware';
import rateLimiterMiddleware from '../../../middleware/rateLimiterMemory';

import { setup, getPlugin, init } from './controller';

const router = express.Router();

router.post('/setup', isAuthenticated, setup);
router.get('/setup', isAuthenticated, getPlugin);

router.get('/init/:key', rateLimiterMiddleware, init);

export const pluginRouter = router;
