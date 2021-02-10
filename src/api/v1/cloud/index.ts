import express from 'express';
import { isAuthenticated } from '../../../middleware';
import { createFolder, fetchFileSystem, updateFolder } from './controller';

const router = express.Router();

router.post('/:id', isAuthenticated, updateFolder);

router.get('/', isAuthenticated, fetchFileSystem);
router.post('/', isAuthenticated, createFolder);

export const cloudRouter = router;
