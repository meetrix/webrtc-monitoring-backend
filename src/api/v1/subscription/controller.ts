/* eslint-disable @typescript-eslint/camelcase */

import { Response, Request, NextFunction } from 'express';
import _ from 'lodash';
import {
  AUTH_LANDING, STRIPE_SECRET_KEY, STRIPE_FREE_PRICE_ID, STRIPE_STANDARD_PRICE_ID, STRIPE_WEBHOOK_SECRET, USER_PACKAGES
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
    if (planId === USER_PACKAGES[0]) {
      priceId = STRIPE_FREE_PRICE_ID;
    } else if (planId === USER_PACKAGES[1]) {
      priceId = STRIPE_STANDARD_PRICE_ID;
    } else if (planId === USER_PACKAGES[2]) {
      priceId = STRIPE_STANDARD_PRICE_ID;       //STRIPE_PREMIUM_PRICE_ID   //update with PREMIUM LATER
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
      success_url: `${AUTH_LANDING}/#/dashboard?strchecsessid={CHECKOUT_SESSION_ID}`,
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


export const checkoutSessionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const user1 = await User.findOne({ id: req.user.sub });
    if (!user1) {
      throw Error('user not found');
    }

    if (!req.body.strchecsessid) {
      throw Error('strchecsessid not defined');
    }

    const user2 = await User.findOne({ 'stripe.checkoutSessionId': req.body.strchecsessid });
    if (!user2) {
      throw Error('strchecsessid not found');
    }
    const user1Id = user1._id.toString();
    const user2Id = user2._id.toString();
    if (user1Id != user2Id) {
      throw Error('invalid strchecsessid');
    }

    user2.stripe.checkoutSessionId = null;
    await user2.save();

    res.status(200).json({
      success: true,
      data: null,
      message: 'checkout Session Status retrieved successfully'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
    next(err);
  }
};

export const stripeEventHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {

  // Check if webhook signing is configured.
  const webhookSecret = STRIPE_WEBHOOK_SECRET;
  let data;
  let eventType;

  if (webhookSecret) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    const signature = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );

      // Extract the object from the event.
      eventType = event.type;
      data = event.data;

    } catch (err) {
      console.log(err);
      console.log('Webhook signature verification failed.' + err.message);
      return res.status(400).json({
        success: false,
        message: 'Webhook signature verification failed'
      });
    }
  } else {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // retrieve the event data directly from the request body.
    eventType = req.body.type;
    data = req.body.data;
  }

  let customerId;

  switch (eventType) {
    case 'checkout.session.completed':
      console.log(eventType);
      console.log(data);
      // Payment is successful and the subscription is created.
      // You should provision the subscription.

      customerId = data.object.customer;
      try {
        const user = await User.findOne({ 'stripe.customerId': customerId });
        if (!user) {
          throw Error('user not found');
        }
        //console.log(user);
        user.stripe.checkoutSessionId = data.object.id;
        user.stripe.subscriptionStatus = 'active';
        await user.save();

      } catch (err) {
        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      break;
    case 'invoice.paid':
      console.log(eventType);
      console.log(data);
      // Continue to provision the subscription as payments continue to be made.
      // Store the status in your database and check when a user accesses your service.
      // This approach helps you avoid hitting rate limits.
      break;
    case 'invoice.payment_failed':
      console.log(eventType);
      console.log(data);
      // The payment failed or the customer does not have a valid payment method.
      // The subscription becomes past_due. Notify your customer and send them to the
      // customer portal to update their payment information.
      break;
    case 'customer.subscription.updated':
      console.log(eventType);
      console.log(data);

      const subscribedPriceId = data.object.items.data[0].price.id;
      customerId = data.object.customer;
      console.log(subscribedPriceId);

      try {
        const user = await User.findOne({ 'stripe.customerId': customerId });
        if (!user) {
          throw Error('user not found');
        }
        //console.log(user);
        let packageName;
        if (subscribedPriceId == STRIPE_FREE_PRICE_ID) {
          packageName = USER_PACKAGES[0];
        } else if (subscribedPriceId == STRIPE_STANDARD_PRICE_ID) {
          packageName = USER_PACKAGES[1];
        } else if (subscribedPriceId == STRIPE_STANDARD_PRICE_ID) {   //STRIPE_PREMIUM_PRICE_ID   //update with PREMIUM LATER
          packageName = USER_PACKAGES[2];
        } else {
          throw Error('invalid plan');
        }
        user.stripe.priceId = subscribedPriceId;
        user.package = packageName;
        await user.save();

      } catch (err) {
        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      break;
    default:
      console.log('unknown event type : ' + eventType);
      console.log(data);
    // Unhandled event type
  }

  res.status(200).json({
    success: true,
    data: {
      event: eventType
    },
    message: 'Webhook updated successfully'
  });
};
