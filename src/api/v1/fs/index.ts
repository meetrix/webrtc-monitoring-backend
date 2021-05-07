import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';

import { s3 } from '../../../util/s3';
import { isAuthenticated } from '../../../middleware';
import {
  createFile,
  createFolder,
  deleteFile,
  deleteFolder,
  deleteManyFiles,
  fetchFileSystem,
  getSettings,
  getSharedFiles,
  migrate,
  moveManyFiles,
  shareFiles,
  updateFile,
  updateFolder,
  updateSettings,
  uploadFile
} from './controller';
import { S3_USER_RECORDINGS_BUCKET } from '../../../config/settings';
import rateLimiterMiddleware from '../../../middleware/rateLimiterMemory';
import { hasPackageOrHigher } from '../../../middleware/authorization';

const upload = multer({
  storage: multerS3({
    s3,
    bucket: S3_USER_RECORDINGS_BUCKET,
    contentDisposition: function (req, file, cb) {
      // Allows cross-origin downloads
      cb(null, `attachment; filename="${file.originalname}.webm"`);
    },
    key: function (req, file, cb) {
      cb(null, `vid/${req.user._id}/${file.originalname}.webm`);
    }
  })
});

const router = express.Router();

router.post('/folders/:id', isAuthenticated, updateFolder);
router.patch('/folders/:id', isAuthenticated, updateFolder);
router.delete('/folders/:id', isAuthenticated, deleteFolder);
router.post('/folders', isAuthenticated, createFolder);

router.post('/files/upload', [isAuthenticated, hasPackageOrHigher('PREMIUM'), upload.any()], uploadFile);
router.post('/files/move', [isAuthenticated, hasPackageOrHigher('PREMIUM', true)], moveManyFiles);
router.post('/files/delete', [isAuthenticated, hasPackageOrHigher('PREMIUM', true)], deleteManyFiles);
router.post('/files/:id', [isAuthenticated, hasPackageOrHigher('PREMIUM', true)], updateFile);
router.patch('/files/:id', [isAuthenticated, hasPackageOrHigher('PREMIUM', true)], updateFile);
router.delete('/files/:id', [isAuthenticated, hasPackageOrHigher('PREMIUM', true)], deleteFile);
router.post('/files', [isAuthenticated, hasPackageOrHigher('PREMIUM')], createFile);

router.get('/share/:id', rateLimiterMiddleware, getSharedFiles);
router.post('/share', [isAuthenticated, hasPackageOrHigher('PREMIUM')], shareFiles);

router.post('/migrate', isAuthenticated, migrate);

router.get('/settings', [isAuthenticated, hasPackageOrHigher('STANDARD', true)], getSettings);
router.post('/settings', [isAuthenticated, hasPackageOrHigher('PREMIUM')], updateSettings);

router.get('/', isAuthenticated, fetchFileSystem);

export const fsRouter = router;
