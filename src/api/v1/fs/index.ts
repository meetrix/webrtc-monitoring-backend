import express from 'express';
import { isAuthenticated } from '../../../middleware';
import {
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
  fetchFileSystem,
  updateFile,
  updateFolder
} from './controller';

const router = express.Router();

router.post('/folders/:id', isAuthenticated, updateFolder);
router.patch('/folders/:id', isAuthenticated, updateFolder);
router.delete('/folders/:id', isAuthenticated, deleteFolder);
router.post('/folders', isAuthenticated, createFolder);

router.post('/files/:id', isAuthenticated, updateFile);
router.patch('/files/:id', isAuthenticated, updateFile);
router.delete('/files/:id', isAuthenticated, deleteFile);
router.post('/files', isAuthenticated, createFile);

router.get('/', isAuthenticated, fetchFileSystem);

export const fsRouter = router;
