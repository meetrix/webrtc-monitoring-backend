import express from 'express';

import rateLimiterMiddleware from '../../../middleware/rateLimiterMemory';
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
 *         description: Feeback Body 
 *         in: body
 *         required: true
 *         schema:
 *              type: object
 *              properties:
 *                  email:
 *                      type: string
 *                      example: beta@meetrix.io
 *                  feedback:
 *                      type: string
 *                      example: This platform is awesome.
 *                  rating:
 *                      type: number
 *                      example: 5
 *                  meta:
 *                      type: any
 *                      example: {}
 *     responses:
 *        200:
 *           description: "Successful Feedback"
 *           schema:
 *               type: object
 *               properties:
 *                   success:
 *                       type: string
 *                       example: true
 *                   data:
 *                       type: string
 *                       example: clientId
 *                   message:
 *                       type: string
 *                       example: Feedback successfully submitted. We will contact you via email shortly.
 *        422:
 *           description: "Missing Field (Name, Email, Feedback)"
 *           schema:
 *               type: object
 *               properties:
 *                   success:
 *                       type: string
 *                       example: false
 *                   data:
 *                       type: string
 *                       example: null
 *                   message:
 *                      type: string
 *                      example: Please enter your name correctly.
 * 
 *        500:
 *           description: "Unsuccessful Feedback"
 *           schema:
 *               type: object
 *               properties:
 *                   success:
 *                       type: string
 *                       example: false
 *                   data:
 *                       type: string
 *                       example: null
 *                   message:
 *                      type: string
 *                      example: Feedback submission failed. Please try again later.
 * 
 * 
 */
router.post('/', rateLimiterMiddleware, feedback);

export const feedbackRouter = router;
