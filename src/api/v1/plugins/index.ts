import express from 'express';

import { hasRoleOrHigher } from '../../../middleware';
import rateLimiterMiddleware from '../../../middleware/rateLimiterMemory';
import {
  getAll,
  create,
  get,
  revoke,
  regenerate,
  getJwtToken,
  getConfig,
  setConfig,
} from './controller';

const router = express.Router();

/**
 * @swagger
 *
 * /plugins/{id}/ice-servers:
 *   get:
 *     description: Get ice-server configs for the specific token
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: "id"
 *         description: "Token/plugin Id"
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ICE Server config
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             data:
 *               type: object
 *
 *       404:
 *         description: ICE config not found
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: ICE config not found.
 *
 *       500:
 *         description: Unknown error
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: Unknown server error.
 */
router.get('/:id/ice-servers', hasRoleOrHigher('user'), getConfig);

/**
 * @swagger
 *
 * /plugins/{id}/ice-servers:
 *   put:
 *     description: Set ice-server configs for the specific token
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: "id"
 *         description: "Token/plugin Id"
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: "ice-servers"
 *         description: ICE Server config
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *     responses:
 *       200:
 *         description: ICE Server config
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             data:
 *               type: object
 *
 *       404:
 *        description: App token not found
 *        schema:
 *          type: object
 *          properties:
 *            success:
 *              type: string
 *              example: false
 *            message:
 *              type: string
 *              example: App token not found.
 *
 *       500:
 *         description: Unknown error
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: Unknown server error.
 */
router.put('/:id/ice-servers', hasRoleOrHigher('user'), setConfig);

// TODO: Remove these endpoints once we can config turn servers per token
/**
 * @swagger
 *
 * /plugins/ice-servers:
 *   get:
 *     description: Get ice-server configs for the default token
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plugin details
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             data:
 *               type: object
 *
 *       404:
 *         description: Plugin not found
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: App token not found.
 *       500:
 *         description: Unknown error
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: Unknown server error.
 */
router.get('/ice-servers', hasRoleOrHigher('user'), getConfig);

/**
 * @swagger
 *
 * /plugins/ice-servers:
 *   put:
 *     description: Set ice-server configs for the default token
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: "ice-servers"
 *         description: ICE Server config
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *     responses:
 *       200:
 *         description: ICE Server config
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             data:
 *               type: object
 *
 *       404:
 *        description: App token not found
 *        schema:
 *          type: object
 *          properties:
 *            success:
 *              type: string
 *              example: false
 *            message:
 *              type: string
 *              example: App token not found.
 *
 *       500:
 *         description: Unknown error
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: Unknown server error.
 */
router.put('/ice-servers', hasRoleOrHigher('user'), setConfig);

/**
 * @swagger
 *
 * /plugins/{id}:
 *   get:
 *     description: Get specific plugin (token details)
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: "id"
 *         description: "Token/plugin Id"
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plugin details
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             data:
 *               properties:
 *                 _id:
 *                   type: string
 *                 domain:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *
 *       404:
 *         description: Plugin not found
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: App token not found.
 *       500:
 *         description: Unknown error
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: Unknown server error.
 */
router.get('/:id', hasRoleOrHigher('user'), get);

/**
 * @swagger
 *
 * /plugins/{id}:
 *   delete:
 *     description: Revoke specific plugin (token details)
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: "id"
 *         description: "Token/plugin Id"
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plugin details
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             data:
 *               properties:
 *                 _id:
 *                   type: string
 *                 domain:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *
 *       404:
 *         description: Plugin not found
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: App token not found.
 *       500:
 *         description: Unknown error
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: Unknown server error.
 */
router.delete('/:id', hasRoleOrHigher('user'), revoke);

/**
 * @swagger
 *
 * /plugins/{id}:
 *   patch:
 *     description: Regenerate token for specific plugin (token details)
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: "id"
 *         description: "Token/plugin Id"
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: New plugin details
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             data:
 *               properties:
 *                 _id:
 *                   type: string
 *                 domain:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *
 *       404:
 *         description: Plugin not found
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: App token not found.
 *       500:
 *         description: Unknown error
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: Unknown server error.
 */
router.patch('/:id', hasRoleOrHigher('user'), regenerate);
router.get('/:id/token', rateLimiterMiddleware, getJwtToken);

/**
 * @swagger
 *
 * /plugins:
 *   get:
 *     description: Get all plugins for the user (token details)
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plugin details
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
 *                 properties:
 *                   _id:
 *                     type: string
 *                   domain:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *
 *       500:
 *         description: Unknown error
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: Unknown server error.
 */
router.get('/', hasRoleOrHigher('user'), getAll);

/**
 * @swagger
 *
 * /plugins:
 *   post:
 *     description: Create a new token
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: body
 *         name: plugin data
 *         description: Plugin details
 *         schema:
 *           type: object
 *           required:
 *             - domain
 *           properties:
 *             domain:
 *               type: string
 *     responses:
 *       201:
 *         description: Plugin details
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             data:
 *               properties:
 *                 _id:
 *                   type: string
 *                 domain:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *
 *       409:
 *         description: A plugin already exists for the domain
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: App token already exists.
 *
 *       500:
 *         description: Unknown error
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: string
 *               example: false
 *             message:
 *               type: string
 *               example: Unknown server error.
 */
router.post('/', hasRoleOrHigher('user'), create);

export const pluginRouter = router;
