import express from 'express';
import { hasRoleOrHigher } from '../../../middleware';
import { index } from './controller';

const router = express.Router();

router.get('/', hasRoleOrHigher('admin'), index);

export const usersRouter = router;
