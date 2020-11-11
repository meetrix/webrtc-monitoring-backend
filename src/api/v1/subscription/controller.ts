/* eslint-disable @typescript-eslint/camelcase */

import { Response, Request, NextFunction } from 'express';
import _ from 'lodash';
import {
  AUTH_LANDING, STRIPE_SECRET_KEY, STRIPE_FREE_PRICE_ID, STRIPE_STANDARD_PRICE_ID
} from '../../../config/settings';

import Stripe from 'stripe';
import { User } from '../../../models/User';
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

export const checkoutSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.body.plan) {
      throw Error('invalid plan');
    }
    const planId = req.body.plan;
    let priceId;
    if (planId === 1) {
      priceId = STRIPE_FREE_PRICE_ID;
    } else if (planId === 2) {
      priceId = STRIPE_STANDARD_PRICE_ID;
    } else {
      throw Error('invalid plan');
    }
    const user = await User.findOne({ id: req.user.sub });
    console.log(req.user.sub);
    if (!user) {
      throw Error('user not found');
    }
    // See https://stripe.com/docs/api/checkout/sessions/create
    // for additional parameters to pass.

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: user.stripe.customerId,
      //customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      // the actual Session ID is returned in the query parameter when your customer
      // is redirected to the success page.
      success_url: `${AUTH_LANDING}/#/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${AUTH_LANDING}/#/dashboard`,
    });
    res.status(200).json({
      success: true,
      data: { sessionId: session.id },
      message: 'Session created successfully'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
    next(err);
  }
};


export const customerPortalUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findOne({ id: req.user.sub });
    console.log(req.user.sub);
    if (!user) {
      throw Error('user not found');
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe.customerId,
      return_url: `${AUTH_LANDING}/#/dashboard`,
    });
    console.log(session);
    res.status(200).json({
      success: true,
      data: { url: session.url },
      message: 'Customerportal url created successfully'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
    next(err);
  }
};
