/* eslint-disable @typescript-eslint/camelcase */

import { Response, Request, NextFunction } from 'express';
import _ from 'lodash';
import {
  AUTH_LANDING, STRIPE_SECRET_KEY, STRIPE_FREE_PRICE_ID, STRIPE_STANDARD_PRICE_ID, STRIPE_WEBHOOK_SECRET, USER_PACKAGES
} from '../../../config/settings';

import Stripe from 'stripe';
import { User } from '../../../models/User';
import { Payment } from '../../../models/Payment';
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

const getPriceIdbyPlanId = (
  planId: string,
): string => {
  if (planId === USER_PACKAGES[0]) {
    return STRIPE_FREE_PRICE_ID;
  } else if (planId === USER_PACKAGES[1]) {
    return STRIPE_STANDARD_PRICE_ID;
  } else if (planId === USER_PACKAGES[2]) {
    return STRIPE_STANDARD_PRICE_ID;       //STRIPE_PREMIUM_PRICE_ID   //update with PREMIUM LATER
  } else {
    throw Error('invalid plan');
  }
};

const getPlanIdByPriceId = (
  priceId: string,
): string => {
  if (priceId == STRIPE_FREE_PRICE_ID) {
    return USER_PACKAGES[0];
  } else if (priceId == STRIPE_STANDARD_PRICE_ID) {
    return USER_PACKAGES[1];
  } else if (priceId == STRIPE_STANDARD_PRICE_ID) {   //STRIPE_PREMIUM_PRICE_ID   //update with PREMIUM LATER
    return USER_PACKAGES[2];
  } else {
    throw Error('invalid plan');
  }
};

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
    const priceId = getPriceIdbyPlanId(planId);

    const user = req.user;

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
    const user = req.user;
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

    const user1 = req.user;

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

      try {
        const invoiceId = data.object.id;
        const subscriptionId = data.object.lines.data[0].subscription;
        const attemptCount = data.object.attempt_count;
        const billingReason = data.object.billing_reason;
        const collectionMethod = data.object.collection_method;
        customerId = data.object.customer;

        const user1 = await User.findOne({ 'stripe.customerId': customerId });
        if (!user1) {
          throw Error('user not found');
        }
        const userId = user1._id.toString();
        const customerEmail = data.object.customer_email;
        const hostedInvoiceUrl = data.object.hosted_invoice_url;
        const invoicePdf = data.object.invoice_pdf;
        const subscriptionItemId = data.object.lines.data[0].subscription_item;
        const priceId = data.object.lines.data[0].price.id;
        const plan = getPlanIdByPriceId(priceId);
        const paid = data.object.paid;
        const status = data.object.status;
        const currency = data.object.currency;
        const amountDue = data.object.amount_due;
        const amountPaid = data.object.amount_paid;
        const subtotal = data.object.subtotal;
        const total = data.object.total;

        const payment = new Payment({
          invoiceId,
          subscriptionId,
          attemptCount,
          billingReason,
          collectionMethod,
          userId,
          customerId,
          customerEmail,
          hostedInvoiceUrl,
          invoicePdf,
          subscriptionItemId,
          priceId,
          plan,
          paid,
          status,
          currency,
          amountDue,
          amountPaid,
          subtotal,
          total,
        });
        await payment.save();

      } catch (err) {
        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      break;
    // case 'invoice.updated':
    //   break;
    case 'invoice.payment_failed':
      console.log(eventType);
      console.log(data);
      // The payment failed or the customer does not have a valid payment method.
      // The subscription becomes past_due. Notify your customer and send them to the
      // customer portal to update their payment information.
      break;
    case 'customer.subscription.updated': // fall-through
    case 'customer.subscription.deleted':
      // Valid for: collection_method=charge_automatically
      // ┌────────────────────────────────────────────────┐
      // │ Subscription                                   │
      // ├────────────────────────────────────────────────┤
      // │ status: incomplete (after first attempt fails) │
      // │         incomplete_expired (after 23h)         │
      // │         active (if payment collected)          │
      // │         past_due (renewal fails - unclear)     │
      // │         canceled^/unpaid (all attempts failed) │
      // └────────────────────────────────────────────────┘
      // ^ as of configured settings

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
        const planId = getPlanIdByPriceId(subscribedPriceId);

        user.stripe.priceId = subscribedPriceId;
        user.stripe.subscriptionId = data.object.id;
        user.stripe.subscriptionItemId = data.object.items.data[0].id;

        if (['canceled', 'unpaid', 'past_due'].includes(data.object.status)) {
          // Deactivate user package
          user.package = getPlanIdByPriceId(STRIPE_FREE_PRICE_ID);
          user.stripe.subscriptionStatus = 'inactive';
        } else if (['incomplete', 'incomplete_expired'].includes(data.object.status)) {
          // Do nothing
        } else { // active
          user.package = planId;
        }
        await user.save();

      } catch (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      break;
    case 'charge.refunded':
    // NOT handled
    // Cancel subscription from the dashboard to remove the subscription AND while doing that,
    // either choose to refund the user, or end the subscription at the end of the current period. 
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
