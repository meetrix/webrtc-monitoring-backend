import express from 'express';

import { isAuthenticated } from '../../../middleware';

import { trackRecording } from './controller';

const router = express.Router();

router.post('/', trackRecording);

export const recordingRouter = router;