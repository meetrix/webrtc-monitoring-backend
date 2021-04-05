import express from 'express';
import { changeSubscriptionPackage, checkoutSession, checkoutSessionStatus, customerPortalUrl, paypalEventHandler, stripeEventHandler } from './controller';
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
 * /subscription/checkoutsessionstatus:
 *    post:
 *     description: Send session status
 *     produces:
 *       - application/json
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: "checkoutSessionId "
 *         description: Checkout session id 
 *         in: body
 *         required: true
 *         schema:
 *              type: object
 *              properties:
 *                  strchecsessid:
 *                      type: string
 *                      example: adiagewyfuvewafuaewgifgk
 *     responses:
 *        200:
 *           description: "Successful checkout session status"
 *           schema:
 *               type: object
 *               properties:
 *                   success:
 *                       type: string
 *                       example: true
 *                   data:
 *                       type: string
 *                       example: null
 *                   message:
 *                       type: string
 *                       example: checkout Session Status retrieved successfully.
 * 
 *        500:
 *           description: "Unsuccessful checkout session status"
 *           schema:
 *               type: object
 *               properties:
 *                   success:
 *                       type: string
 *                       example: false
 *                   error:
 *                       type: string
 *                       example: invalid strchecsessid
 * 
 * 
 */
router.post('/checkoutsessionstatus', isAuthenticated, checkoutSessionStatus);

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

router.post('/update', isAuthenticated, changeSubscriptionPackage);

//dont put swagger here
router.post('/stripeeventhandler/sr5h5vym2ayvft4fzkcgx6xbbrk53h3yshqzrm6xgqhdwr3k457754q2dta3dx8f', stripeEventHandler);

//dont put swagger here either
router.post('/paypaleventhandler/jocm52kh7qal4diyahbz2rwkv6bq2elzignx8fd8mad23rbigyq4kujs0t9qn82y', paypalEventHandler);

export const subscriptionRouter = router;
