import express from 'express';
import { hasRoleOrHigher, isPluginUser } from '../../../middleware';

import { getSession, getSessions, postSession } from './controller';

const router = express.Router();

/**
 * @swagger
 * /troubleshooter:
 *   post:
 *     description: Post test results of a troubleshooter session as a plugin user
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: "X-Client-Id"
 *         description: Client Id
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Same document
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             data:
 *               type: object
 *       401:
 *         description: No auth provided
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: false
 *             error:
 *               type: string
 *               example: No authentication token provided.
 */
router.post('/', isPluginUser(), postSession);

/**
 * @swagger
 * /troubleshooter/{id}:
 *   get:
 *     description: Gets details of a troubleshooter session
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         description: Troubleshooter session id
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Troubleshooter session document
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             data:
 *               type: object
 *       401:
 *         description: No auth provided
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: false
 *             error:
 *               type: string
 *               example: No authentication token provided.
 */
router.get('/:id', hasRoleOrHigher('user'), getSession);

/**
 * @swagger
 * /troubleshooter:
 *   get:
 *     description: Gets details of many troubleshooter sessions
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startTime
 *         description: Start time (inclusive)
 *         in: query
 *         required: false
 *         type: time
 *       - name: endTime
 *         description: End time (exclusive)
 *         in: query
 *         required: false
 *         type: time
 *       - name: pluginId
 *         description: Filter by plugin id
 *         in: query
 *         required: false
 *         type: string
 *       - name: clientId
 *         description: Filter by client id
 *         in: query
 *         required: false
 *         type: string
 *       - name: limit
 *         description: Limit for pagination
 *         in: query
 *         required: false
 *         type: number
 *       - name: offset
 *         description: Offset for pagination
 *         in: query
 *         required: false
 *         type: number
 *     responses:
 *       200:
 *         description: Selected/All troubleshooter session documents
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             data:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: No auth provided
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: false
 *             error:
 *               type: string
 *               example: No authentication token provided.
 */
router.get('/', hasRoleOrHigher('user'), getSessions);

export const troubleshooterRouter = router;
