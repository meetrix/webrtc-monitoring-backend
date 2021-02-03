import express from 'express';

import { trackRecording } from './controller';

const router = express.Router();

router.post('/', trackRecording);

export const recordingRouter = router;