import express from 'express';
import { trim } from './controller';
import { isAuthenticated } from '../../../middleware';

const router = express.Router();

router.post('/trim/:id', [isAuthenticated], trim);

export const trimRouter = router;
