import express from 'express';
import { hasRoleOrHigher } from '../../../middleware';
import { getByDomain } from './controller';

const router = express.Router();

/**
 * @swagger
 *
 * /client/{domain}:
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
 *         schema:
 *             type: string
 *     responses:
 *       200:
 *          description: Get active clients for a given domain name
 *          schema:
 *              type: array
 *              items:
 *                 type: object
 *                 properties:
 *                   id:
 *                    type: string
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

router.get('/:domain', hasRoleOrHigher('user'), getByDomain);

export const clientsRouter = router;
