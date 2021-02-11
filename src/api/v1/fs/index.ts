import express from 'express';
import { isAuthenticated } from '../../../middleware';
import { createFolder, deleteFolder, fetchFileSystem, updateFolder } from './controller';

const router = express.Router();

router.post('/folders/:id', isAuthenticated, updateFolder);
router.patch('/folders/:id', isAuthenticated, updateFolder);
router.delete('/folders/:id', isAuthenticated, deleteFolder);
router.post('/folders', isAuthenticated, createFolder);

router.get('/', isAuthenticated, fetchFileSystem);

export const fsRouter = router;
