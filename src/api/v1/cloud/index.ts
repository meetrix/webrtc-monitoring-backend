import express from 'express';
import { isAuthenticated } from '../../../middleware';
import { fetchFileSystem } from './controller';

const router = express.Router();

router.get('/', isAuthenticated, fetchFileSystem);

export const cloudRouter = router;
