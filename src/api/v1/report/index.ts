import express from 'express';
import { hasRoleOrHigher } from '../../../middleware';
import { getReport } from './controller';

const router = express.Router();

/**
 * @swagger
 *
 * /report/{domain}/{clientId}:
 *    get:
 *     description: Get active clients for a given domain name
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: "domain"
 *         description: "Domain name"
 *         in: path
 *         required: true
 *         type: string
 *       - name: "clientId"
 *         description: "Client Id"
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *          description: Get active clients for a given domain name
 *          schema:
 *              type: object
 *
 *       500:
 *          description: Unsuccessful Fetching User Profile
 *          schema:
 *              type: object
 *              properties:
 *                  success:
 *                      type: string
 *                      example: false
 *                  data:
 *                      type: string
 *                      example: null
 *                  message:
 *                      type: string
 *                      example: Something went wrong. Please try again later.
 */

router.get('/:domain/:clientId', hasRoleOrHigher('user'), getReport);

export const reportRouter = router;
