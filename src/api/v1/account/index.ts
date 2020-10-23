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
 *        200:
 *           description: "Successful Reset Link Request"
 *           schema:
 *               type: object
 *               properties:
 *                   success:
 *                       type: string
 *                       example: true
 *                   data:
 *                       type: string
 *                       example: token
 *                   message:
 *                       type: string
 *                       example: Password reset link has been sent to your mail successfully. It will be valid for next 60 minutes.
 *        401:
 *           description: "Invalid Data"
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
 *                       example: Invalid data. Please try again.
 *        500:
 *          description: Unsuccessful Reset Link Request
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
 *        200:
 *           description: "Successful Password Reset"
 *           schema:
 *               type: object
 *               properties:
 *                   success:
 *                       type: string
 *                       example: true
 *                   data:
 *                       type: string
 *                       example: token
 *                   message:
 *                       type: string
 *                       example: Password reset successful. Sign in back to access your account.
 *   
 *        500:
 *          description: Unsuccessful Reset Link Request
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
router.post('/reset/:token', reset);

/**
 * @swagger
 *
 * /account/profile:
 *    get:
 *     description: Get User Profile
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *          description: Fetch Registered User Profile
 *          schema:
 *              type: object
 *              properties:
 *                  data:
 *                       properties:
 *                          id:
 *                             type: string
 *                          isVerified:
 *                             type: string
 *                             example: true
 *                          email:
 *                             type: string
 *                          role:
 *                             type: string
 *                          avatar:
 *                             type: string
 *                          profile:
 *                             type: object
 *                             properties:
 *                                 name:
 *                                     type: string
 *                                 picture:
 *                                     type: string
 *                          tag:
 *                             type: object
 *                             properties:
 *                                 tagId:
 *                                     type: string
 *                                 title:
 *                                     type: string
 *                                 status:
 *                                     type: string
 *                                 createdAt:
 *                                     type: string
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
router.get('/profile', isAuthenticated, getProfile);
router.post('/profile', isAuthenticated, postProfile);
router.post('/password', isAuthenticated, password);
router.post('/delete', isAuthenticated, deleteAccount);

export const accountRouter = router;
