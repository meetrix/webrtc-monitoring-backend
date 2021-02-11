import express from 'express';
import { isAuthenticated } from '../../../middleware';
import { createFolder, deleteFolder, fetchFileSystem, updateFolder } from './controller';

const router = express.Router();

router.post('/:id', isAuthenticated, updateFolder);
router.patch('/:id', isAuthenticated, updateFolder);
router.delete('/:id', isAuthenticated, deleteFolder);

router.get('/', isAuthenticated, fetchFileSystem);
router.post('/', isAuthenticated, createFolder);

export const cloudRouter = router;
