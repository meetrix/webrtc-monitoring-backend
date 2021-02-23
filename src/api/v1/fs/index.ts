import express from 'express';
import { isAuthenticated } from '../../../middleware';
import {
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
  fetchFileSystem,
  getSettings,
  migrate,
  updateFile,
  updateFolder,
  updateSettings
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

router.post('/migrate', isAuthenticated, migrate);

router.get('/settings', isAuthenticated, getSettings);
router.post('/settings', isAuthenticated, updateSettings);

router.get('/', isAuthenticated, fetchFileSystem);

export const fsRouter = router;
