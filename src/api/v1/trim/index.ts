import express from 'express';

import { trim } from './controller';
import { isAuthenticated } from '../../../middleware';
import { hasPackageOrHigher } from '../../../middleware/authorization';

const router = express.Router();

router.post('/:id', [isAuthenticated, hasPackageOrHigher('PREMIUM')], trim);

export const trimRouter = router;
