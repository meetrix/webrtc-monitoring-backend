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
  password,
  verify,
  resetPassword,
} from './controller';
import { isAuthenticated } from '../../../middleware';

const router = express.Router();

// Sliding session - also used to refresh jwt payload (such as role change)
router.get('/jwt/refresh', isAuthenticated, refresh);

// Verify user account via email
router.get('/verify', verify);

router.get('/resetpassword', resetPassword);


/**
 * @swagger
 *
 * /account/login:
 *     post:
 *      description: Login as registered user (Manual)
 *      produces:
 *       - application/json
 *      parameters:
 *        - name: "login"
 *          description: Enter registered email address and correct password. (Login body)
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
 *        200:
 *           description: "Successful Signin"
 *           schema:
 *               type: object
 *               properties:
 *                   success:
 *                       type: string
 *                       example: true
 *                   data:
 *                       type: string
 *                       example: SignToken(user)
 *                   message:
 *                       type: string
 *                       example: Login successful. Redirecting...
 *        401:
 *           description: "Email & Password Not Matching"
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
 *                       type: string
 *                       example: Username or Password incorrect. Please check and try again.
 *        500:
 *          description: Unsuccessful Signin
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
 *        404:
 *          description: Unavailable Account
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
 *                      example: Email address not found in our system.
 */
router.post('/login', login);

/**
 * @swagger
 *
 * /account/register:
 *    post:
 *     description: Register as a new user (Manual)
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: "register"
 *         description: Enter email address & password to register. (Registration body)
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
 *       200:
 *          description: Successful Registration (Account should be verifed by email confirmation)
 *          schema:
 *              type: object
 *              properties:
 *                  success:
 *                      type: string
 *                      example: true
 *                  data:
 *                      type: string
 *                      example: emailToken
 *                  message:
 *                      type: string
 *                      example: Confirmation email has been sent successfully. Please check your inbox to proceed.
 *       500:
 *          description: Unsuccessful Registration
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
 *                      example: Registration Failed. Please try again later.
 *       422:
 *          description: Existing Account (User)
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
 *                      example:  Account already exists.
 */
router.post('/register', register);


/**
 * @swagger
 *
 * /account/forgot:
 *     post:
 *      description: forgot
 *      produces:
 *       - application/json
 *      parameters:
 *        - name: "forgotpassword"
 *          description: "Forgot Password Body"
 *          in: body
 *          required: true
 *          schema:
 *              type: object
 *              properties:
 *                  email:
 *                      type: string
 *                      example: "beta@meetrix.io"
 *
 *      responses:
 *          201:
 *              description: Email has been sent with the reset token successfully.
 *          404:
 *              description: Email Address not found in our system.
 *
 *
 *
 */
router.post('/forgot', forgot);

/**
 * @swagger
 *
 * /account/reset:
 *     post:
 *      description: reset
 *      produces:
 *       - application/json
 *      parameters:
 *        - name: "passwordreset"
 *          description: "Password Reset Body"
 *          in: body
 *          required: true
 *          schema:
 *              type: object
 *              properties:
 *                  new password:
 *                      type: string
 *                      example: "MP123@meet"
 *                  confirm password:
 *                      type: string
 *                      example: "MP123@meet"
 *
 *
 *      responses:
 *          201:
 *              description: Password reset successful.
 *          422:
 *              description: Password reset failed or Invalid token.
 *          404:
 *              description: Internal resource not found.
 *
 *
 *
 */
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
