import express from 'express';

import {
    refresh,
    login,
    register,
    forgot,
    reset,
    getProfile,
    postProfile,
    deleteAccount,
    password
} from './controller';
import { isAuthenticated } from '../../../middleware';

const router = express.Router();

// Sliding session - also used to refresh jwt payload (such as role change)
router.get('/jwt/refresh', isAuthenticated, refresh);

/**
 * @swagger
 *
 * /account/login:
 *     post:
 *      description: login
 *      produces:
 *       - application/json
 *      parameters:
 *        - name: "login"
 *          description: "Login body"
 *          in: body
 *          required: true
 *          schema:
 *              type: object
 *              properties:
 *                  email:
 *                      type: string
 *                      example: "beta@meetrix.io"
 *                  password:
 *                      type: string
 *                      example: test1234
 *      responses:
 *          201:
 *              description: "Login successful"
 *              schema:
 *                  type: object
 *                  properties:
 *                      token:
 *                          type: string
 *
 */
router.post('/login', login);

/**
 * @swagger
 *
 * /account/register:
 *    post:
 *     description: Register as a user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: "register"
 *         description: email for used registration.
 *         in: body
 *         required: true
 *         schema:
 *              type: object
 *              properties:
 *                  email:
 *                      type: string
 *                      example: beta@meetrix.io
 *                  password:
 *                      type: string
 *                      example: test1234
 *     responses:
 *       201:
 *          description: Registered
 *          schema:
 *              type: object
 *              properties:
 *                  token:
 *                      type: string
 *       422:
 *          description: Account already exists
 */
router.post('/register', register);
router.post('/forgot', forgot);
router.post('/reset/:token', reset);

/**
 * @swagger
 *
 * /account/profile:
 *    get:
 *     description: Register as a user
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *          description: Registered
 *          schema:
 *              type: object
 *              properties:
 *                  id:
 *                      type: string
 *                  email:
 *                      type: string
 *                  role:
 *                      type: string
 *                  avatar:
 *                      type: string
 *                  profile:
 *                      type: object
 *                      properties:
 *                          name:
 *                              type: string
 *                          picture:
 *                              type: string
 *       401:
 *          description: Unauthorized
 */
router.get('/profile', isAuthenticated, getProfile);
router.post('/profile', isAuthenticated, postProfile);
router.post('/password', isAuthenticated, password);
router.post('/delete', isAuthenticated, deleteAccount);

export const accountRouter = router;
