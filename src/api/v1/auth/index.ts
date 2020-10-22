import express from 'express';
import { authCallback } from './controller';
import { facebookAuth, facebookAuthCallback, googleAuth, googleAuthCallback, linkedinAuth, linkedinAuthCallback } from '../../../middleware/auth';

const router = express.Router({ strict: false });

// `/google/callback` should be defined prior to `/google`

router.use('/google/callback', googleAuthCallback, authCallback);

/**
 * @swagger
 * /auth/google:
 *  get:
 *      description: Redirect to Google for authentication
 *      produces:
 *          - application/json
 *      responses:
 *          302:
 *              description: Redirect to Google
 *
 *
 */
router.use('/google', googleAuth);

router.use('/facebook/callback', facebookAuthCallback, authCallback);
/**
 * @swagger
 * /auth/facebook:
 *  get:
 *      description: Redirect to Facebook for authentication
 *      produces:
 *          - application/json
 *      responses:
 *          302:
 *              description: Redirect to Facebook
 *
 *
 */
router.use('/facebook', facebookAuth);

router.use('/linkedin/callback', linkedinAuthCallback, authCallback);
/**
 * @swagger
 * /auth/linkedin:
 *  get:
 *      description: Redirect to LinkedIn for authentication
 *      produces:
 *          - application/json
 *      responses:
 *          302:
 *              description: Redirect to LinkedIn
 *
 *
 */
router.use('/linkedin', linkedinAuth);
export const authRouter = router;
