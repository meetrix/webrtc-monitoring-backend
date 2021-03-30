import multer from 'multer';
import express from 'express';

import { hasRoleOrHigher } from '../../../middleware';
import { upload } from './controller';

const router = express.Router();
const m = multer({});

router.post('/', [hasRoleOrHigher('admin'), m.any()], upload);

export const uploadRouter = router;
