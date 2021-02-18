import express from 'express';

import { healthCheck } from './controller';

const router = express.Router();

router.get('/healthcheck', healthCheck);

export const miscRouter = router;
