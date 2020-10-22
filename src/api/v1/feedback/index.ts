import express from 'express';
import { feedback } from './controller';

const router = express.Router();

/**
 * @swagger
 *
 * /feedback:
 *    post:
 *     description: Send feedback or inquiry to database
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: "Feedbacks"
 *         description: Sending feedbacks to db.
 *         in: body
 *         required: true
 *         schema:
 *              type: object
 *              properties:
 *                  name:
 *                      type: string
 *                      example: Steve Jobs
 *                  email:
 *                      type: string
 *                      example: beta@meetrix.io
 *                  feedback:
 *                      type: string
 *                      example: This platform is awesome.
 *     responses:
 *       200:
 *          description: Feedback sending successful.
 *
 *       400:
 *          description: Feedback sending unsuccessful.
 */
router.post('/', feedback);

export const feedbackRouter = router;
