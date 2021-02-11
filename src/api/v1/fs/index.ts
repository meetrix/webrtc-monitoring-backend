import express from 'express';
import { isAuthenticated } from '../../../middleware';
import { createFolder, deleteFolder, fetchFileSystem, updateFolder } from './controller';

const router = express.Router();

router.post('/:id', isAuthenticated, updateFolder);
router.patch('/:id', isAuthenticated, updateFolder);
router.delete('/:id', isAuthenticated, deleteFolder);
router.post('', isAuthenticated, createFolder);

router.get('/', isAuthenticated, fetchFileSystem);

export const fsRouter = router;
