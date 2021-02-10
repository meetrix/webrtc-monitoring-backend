import express from 'express';
import { isAuthenticated } from '../../../middleware';
import { createFolder, fetchFileSystem } from './controller';

const router = express.Router();

router.get('/', isAuthenticated, fetchFileSystem);
router.post('/', isAuthenticated, createFolder);

export const cloudRouter = router;
