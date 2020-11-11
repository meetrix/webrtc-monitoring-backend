import express from 'express';
import { checkoutSession, customerPortalUrl } from './controller';
import { isAuthenticated } from '../../../middleware';

const router = express.Router();

/**
 * @swagger
 *
 * /subscription/checkoutsession:
 *    post:
 *     description: Send session to checkout
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: "Packages"
 *         description: Packages 
 *         in: body
 *         required: true
 *         schema:
 *              type: object
 *              properties:
 *                  plan:
 *                      type: integer
 *                      example: 2
 *     responses:
 *        200:
 *           description: "Successful checkout session"
 *           schema:
 *               type: object
 *               properties:
 *                   success:
 *                       type: string
 *                       example: true
 *                   data:
 *                       type: object
 *                       properties:
 *                            sessionId:
 *                                type: string
 *                                example: cs_test_ceuAK4GDwaZz2O6Hg64QISf7n1caOWe9YkRVJJWU1V1dog9QxoLaqS0M
 *                   message:
 *                       type: string
 *                       example: Session created successfully.
 * 
 *        500:
 *           description: "Unsuccessful checkout session"
 *           schema:
 *               type: object
 *               properties:
 *                   success:
 *                       type: string
 *                       example: false
 *                   error:
 *                       type: string
 *                       example: invalid plan
 * 
 * 
 */
router.post('/checkoutsession', isAuthenticated, checkoutSession);

/**
 * @swagger
 *
 * /subscription/customerportalurl:
 *    get:
 *     description: Send url to customerportal
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     responses:
 *        200:
 *           description: "Successful url to customerportal"
 *           schema:
 *               type: object
 *               properties:
 *                   success:
 *                       type: string
 *                       example: true
 *                   data:
 *                       type: object
 *                       properties:
 *                            url:
 *                                type: string
 *                                example: https://billing.stripe.com/session/_IL5LBqDzHB9pxaruHYLdSvbUpLRX2dr
 *                   message:
 *                       type: string
 *                       example: Customerportal url created successfully
 * 
 *        500:
 *           description: "Unsuccessful url to customerportal"
 *           schema:
 *               type: object
 *               properties:
 *                   success:
 *                       type: string
 *                       example: false
 *                   error:
 *                       type: string
 *                       example: Error acquiring customer portal url
 * 
 * 
 */
router.get('/customerportalurl', isAuthenticated, customerPortalUrl);

export const subscriptionRouter = router;
