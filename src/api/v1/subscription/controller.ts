/* eslint-disable @typescript-eslint/camelcase */

import { Response, Request, NextFunction } from 'express';
import Stripe from 'stripe';
import _ from 'lodash';
import {
  AUTH_LANDING,
  STRIPE_WEBHOOK_SECRET,
  PAYPAL_FREE_PLAN_ID,
  PAYPAL_STANDARD_PLAN_ID,
  PAYPAL_PREMIUM_PLAN_ID,
  PAYPAL_STANDARD_TRIAL_PLAN_ID,
  PAYPAL_PREMIUM_TRIAL_PLAN_ID,
  PAYPAL_STANDARD_MONTHLY_PLAN_ID,
  PAYPAL_PREMIUM_MONTHLY_PLAN_ID,
  PAYPAL_STANDARD_MONTHLY_TRIAL_PLAN_ID,
  PAYPAL_PREMIUM_MONTHLY_TRIAL_PLAN_ID,
  USER_PACKAGES
} from '../../../config/settings';

import { User, UserDocument } from '../../../models/User';
import { Payment, PaymentDocument } from '../../../models/Payment';
import { getSubscriptionStatus } from '../../../util/auth';
import { getPriceIdbyPlanId, getPlanIdByPriceId, stripe } from '../../../util/stripe';
import { payPalClient } from '../../../util/paypalRest';

const getPlanIdByPayPalPlanId = (
  payPalPlanId: string,
): string => {
  switch (payPalPlanId) {
    case PAYPAL_FREE_PLAN_ID:
      return USER_PACKAGES[0];
    case PAYPAL_STANDARD_PLAN_ID: // fall-through
    case PAYPAL_STANDARD_TRIAL_PLAN_ID: // fall-through
    case PAYPAL_STANDARD_MONTHLY_PLAN_ID: // fall-through
    case PAYPAL_STANDARD_MONTHLY_TRIAL_PLAN_ID:
      return USER_PACKAGES[1];
    case PAYPAL_PREMIUM_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_TRIAL_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_MONTHLY_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_MONTHLY_TRIAL_PLAN_ID:
      return USER_PACKAGES[2];
    default:
      break;
  }

  throw Error('invalid plan');
};

const isATrialPlan = (
  payPalPlanId: string
): boolean => {
  switch (payPalPlanId) {
    case PAYPAL_STANDARD_TRIAL_PLAN_ID: // fall-through
    case PAYPAL_STANDARD_MONTHLY_TRIAL_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_TRIAL_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_MONTHLY_TRIAL_PLAN_ID:
      return true;

    case PAYPAL_FREE_PLAN_ID: // fall-through
    case PAYPAL_STANDARD_PLAN_ID: // fall-through
    case PAYPAL_STANDARD_MONTHLY_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_PLAN_ID: // fall-through
    case PAYPAL_PREMIUM_MONTHLY_PLAN_ID: // fall-through
    default:
      return false;
  }
};

const getPayPalPlanIdByPlanId = (
  planId: string,
  freeTrial: boolean = false,
  period: 'yearly' | 'monthly' = 'yearly'
): string => {
  if (planId === USER_PACKAGES[0]) {
    return PAYPAL_FREE_PLAN_ID;
  }

  if (freeTrial) {
    if (period === 'monthly') {
      switch (planId) {
        case USER_PACKAGES[1]:
          return PAYPAL_STANDARD_MONTHLY_TRIAL_PLAN_ID;
        case USER_PACKAGES[2]:
          return PAYPAL_PREMIUM_MONTHLY_TRIAL_PLAN_ID;
        default:
          throw Error('invalid plan');
      }
    } else if (period === 'yearly') {
      switch (planId) {
        case USER_PACKAGES[1]:
          return PAYPAL_STANDARD_TRIAL_PLAN_ID;
        case USER_PACKAGES[2]:
          return PAYPAL_PREMIUM_TRIAL_PLAN_ID;
        default:
          throw Error('invalid plan');
      }
    } else {
      throw Error('invalid plan');
    }
  } else {
    if (period === 'monthly') {
      switch (planId) {
        case USER_PACKAGES[1]:
          return PAYPAL_STANDARD_MONTHLY_PLAN_ID;
        case USER_PACKAGES[2]:
          return PAYPAL_PREMIUM_MONTHLY_PLAN_ID;
        default:
          throw Error('invalid plan');
      }
    } else if (period === 'yearly') {
      switch (planId) {
        case USER_PACKAGES[1]:
          return PAYPAL_STANDARD_MONTHLY_PLAN_ID;
        case USER_PACKAGES[2]:
          return PAYPAL_PREMIUM_MONTHLY_PLAN_ID;
        default:
          throw Error('invalid plan');
      }
    } else {
      throw Error('invalid plan');
    }
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
    const priceId = getPriceIdbyPlanId(planId, req.body.period || 'yearly');

    const user = req.user;

    // See https://stripe.com/docs/api/checkout/sessions/create
    // for additional parameters to pass.

    if (
      req.body.freeTrial
      && req.user.trialsConsumed
      && req.user.trialsConsumed.includes(planId)
    ) {
      res.status(403).json({
        success: false,
        error: 'Trial for this package has already been consumed.'
      });
      return;
    }

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
      ...(req.body.freeTrial && {
        subscription_data: {
          trial_period_days: 14,
        }
      }),
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

/**
 * @see Stripe [customer portal settings](https://dashboard.stripe.com/test/settings/billing/portal) 
 * to change the products included when changing subscription
 * 
 */
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
  }
};

export const changeSubscriptionPackage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subscriptionProvider } = getSubscriptionStatus(req.user);

    if (subscriptionProvider === 'stripe') {
      const subscriptionId = req.user.stripe.subscriptionId;
      const planId = req.body.plan;
      const priceId = getPriceIdbyPlanId(planId, req.body.period || 'yearly');

      if (!subscriptionId || !planId || !priceId) {
        res.status(404).json({
          success: false,
          error: 'No existing subscription found. '
        });
      }

      if (
        req.body.freeTrial
        && req.user.trialsConsumed
        && req.user.trialsConsumed.includes(planId)
      ) {
        res.status(403).json({
          success: false,
          error: 'Trial for this package has already been consumed.'
        });
        return;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      const response = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
        proration_behavior: 'always_invoice',
        items: [{
          id: subscription.items.data[0].id,
          price: priceId,
        }],
        ...(req.body.freeTrial && { trial_end: Math.ceil(Date.now() / 1000) + 14 * 24 * 3600 }),
      });
    } else if (subscriptionProvider === 'paypal') {

      // TODO: [PAYPAL] Handle either with /revise here or, remove this block of code and 
      // /cancel the previous subscription and do the refund manually when the webhook receives 
      // the details of the new subscription. 
      // /v1/billing/subscriptions/{id}/revise 
      //  --  Activates the new plan at the next billing date; have to provide a link to the user
      //      to approve. No proration done. 
      // /v1/billing/subscriptions/{id}/cancel 
      //  --  Cancels the subscription without user confirmation. BILLING.SUBSCRIPTION.CANCELLED.
      //      No proration done. 

    } else {
      // Ureachable
    }

    res.status(200).json({
      success: true,
      message: 'Package changed successfully.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
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
    // next(err);
  }
};

const getBetterPackage = (package1: string, package2: string): string => {
  return USER_PACKAGES.indexOf(package1) > USER_PACKAGES.indexOf(package2) ? package1 : package2;
};

/**
 * Handles misc. changes needed when changing plans such as the below. 
 * 
 * Downgrade PREMIUM: Turning off cloud auto upload 
 * 
 * @param oldPackage 
 * @param newPackage 
 * @param user 
 */
const handlePackageTransition = (
  oldPackage: string,
  newPackage: string,
  user: UserDocument
): void => {
  if (oldPackage === 'PREMIUM' || oldPackage === 'STANDARD'
    && USER_PACKAGES.indexOf(newPackage) < USER_PACKAGES.indexOf('STANDARD')) {
    user.fileSystemSettings.cloudSync = false;
  }
  if (USER_PACKAGES.indexOf(newPackage) >= USER_PACKAGES.indexOf('STANDARD')) {
    user.fileSystemSettings = { ...user.fileSystemSettings, cloudSync: true };
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
        // Capture the new latest plan, skip proration line items for current plan
        const newLineIndex = data.object.lines.total_count - 1;

        const invoiceId = data.object.id;
        const subscriptionId = data.object.lines.data[newLineIndex].subscription;
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
        const subscriptionItemId = data.object.lines.data[newLineIndex].subscription_item;
        const priceId = data.object.lines.data[newLineIndex].price.id;
        const plan = getPlanIdByPriceId(priceId);
        const paid = data.object.paid;
        const status = data.object.status;
        const currency = data.object.currency;
        const amountDue = data.object.amount_due;
        const amountPaid = data.object.amount_paid;
        const subtotal = data.object.subtotal;
        const total = data.object.total;

        const payment = new Payment({
          provider: 'stripe',
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
          // Provide read-only functionality to the highest package the user ever had
          user.limitedPackage = getBetterPackage(
            user.limitedPackage || USER_PACKAGES[0],
            user.package || USER_PACKAGES[0]
          );
          // Downgrade user package
          user.package = USER_PACKAGES[0];
          handlePackageTransition(planId, USER_PACKAGES[0], user);
          if (data.object.status.status === 'canceled') {
            user.stripe = {
              ...user.stripe,
              priceId: null,
              checkoutSessionId: null,
              subscriptionId: null,
              subscriptionItemId: null,
              subscriptionStatus: 'pending'
            };
          }
        } else if (['incomplete', 'incomplete_expired'].includes(data.object.status)) {
          // Mark package as inactive but still provide the functionality
          user.stripe.subscriptionStatus = 'inactive';
        } else { // active, trialing
          handlePackageTransition(user.package, planId, user);
          user.package = planId;
          user.stripe.subscriptionStatus = 'active';
          // Provide read-only functionality to the highest package the user ever had
          user.limitedPackage = getBetterPackage(
            user.limitedPackage || USER_PACKAGES[0],
            user.package || USER_PACKAGES[0]
          );

          // Allow only one trial for one email address
          if (data.object.status === 'trialing') {
            user.trialsConsumed = user.trialsConsumed || [];
            user.trialsConsumed.push(planId);
          }
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

const fillPaymentDetailsFromPayPalSubscription = async (
  eventType: string,
  subscription: any,
  payment: PaymentDocument,
): Promise<void> => {
  switch (eventType) {
    case '': // fall-through -- confirming subscription via paypal REST API
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
      payment.provider = 'paypal';
      payment.customerId = subscription.subscriber.payer_id;
      payment.customerEmail = subscription.subscriber.email_address;
      payment.amountDue = subscription.billing_info.outstanding_balance.value;
      payment.amountPaid = subscription.billing_info.last_payment.amount.value;
    // fall-through
    case 'BILLING.SUBSCRIPTION.CREATED':
      payment.subscriptionId = subscription.id;
      payment.priceId = subscription.plan_id;
      payment.plan = getPlanIdByPayPalPlanId(subscription.plan_id);
      payment.userId = subscription.custom_id;
      payment.status = subscription.status;
      break;
    default:
      break;
  }
};

const processPayPalSubscriptionObject = async (
  user: UserDocument,
  subscription: any,
  eventType: string = ''
): Promise<void> => {
  // Do nothing on cancellation/expiry of an old subscription
  if (['SUSPENDED', 'CANCELLED', 'EXPIRED'].includes(subscription.status)
    && user.paypal?.subscriptionId !== subscription.id) {
    return;
  }

  // Subscriber does not exist when BILLING.SUBSCRIPTION.CREATED
  user.paypal.payerId = subscription.subscriber?.payer_id || user.paypal?.payerId;
  user.paypal.emailAddress = subscription.subscriber?.email_address || user.paypal?.emailAddress;

  user.paypal.planId = subscription.plan_id;
  user.paypal.subscriptionId = subscription.id;

  // Status = APPROVAL_PENDING, APPROVED, ACTIVE, SUSPENDED, CANCELLED, EXPIRED
  if (['ACTIVE'].includes(subscription.status)) {
    const newPackage = getPlanIdByPayPalPlanId(subscription.plan_id);
    handlePackageTransition(user.package, newPackage, user);
    user.package = newPackage;
    user.paypal.subscriptionStatus = 'active';
    user.limitedPackage = getBetterPackage(
      user.limitedPackage || USER_PACKAGES[0],
      user.package || USER_PACKAGES[0]
    );

    if (isATrialPlan(subscription.plan_id)) {
      user.trialsConsumed = user.trialsConsumed || [];
      user.trialsConsumed.push(newPackage);
    }
  } else if (['SUSPENDED', 'CANCELLED', 'EXPIRED'].includes(subscription.status)) {
    // Downgrade user package
    user.limitedPackage = getBetterPackage(
      user.limitedPackage || USER_PACKAGES[0],
      user.package || USER_PACKAGES[0]
    );
    handlePackageTransition(user.package, USER_PACKAGES[0], user);
    user.package = USER_PACKAGES[0];
    if (subscription.status === 'CANCELLED') {
      user.paypal = {
        payerId: null,
        emailAddress: null,
        planId: null,
        subscriptionId: null,
        subscriptionStatus: 'pending'
      };
    }
  } else { // APPROVAL_PENDING, APPROVED
    // Mark package as inactive but still provide the functionality
    // i.e.: Doesn't change package
    user.stripe.subscriptionStatus = 'inactive';
  }

  await user.save();

  // Store payment details
  let payment = await Payment.findOne(
    { subscriptionId: subscription.id, userId: user._id }, {}, { sort: { createdAt: -1 } }
  );
  if (!payment) {
    payment = new Payment();
  }
  fillPaymentDetailsFromPayPalSubscription(eventType, subscription, payment);
  await payment.save();
};

/**
 * Called by frontend with subscriptionId so the payment/subscription information can be fetched via 
 * PayPal REST API and added to the database. This method was added to mitigate the long delays
 * caused by paypal webhook calls. N.B.: Hooks are still working but since the same data we fetch
 * inside this function are received via hooks, there should be no impact. 
 * 
 * @param req 
 * @param res 
 * @param next 
 */
export const confirmPayPalSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const subscriptionId = req.body.subscriptionId;
    const subscription = await payPalClient.getSubscription(subscriptionId);
    console.log(subscription);

    const success = subscription && subscription.custom_id === req.user._id.toString();

    if (success) {
      await processPayPalSubscriptionObject(req.user, subscription);
    }

    res.status(200).json({
      success: success,
      data: {
        // subscription,
      },
      message: `Subscription validity: ${success}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * N.B.: Webhooks are asynchronous, their **order is not guaranteed**, 
 * and idempotency **might lead to a duplicate notification** of the same event type. 
 * Developer note: PayPal webhooks messages take a long time to arrive and are possibly not in order.
 * @see [PAYPAL REST API](https://developer.paypal.com/docs/api-basics/notifications/webhooks/rest/)
 */
export const paypalEventHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const eventType = req.body.event_type;
  const resourceType = req.body.resource_type;

  console.log('PayPal Event: ', eventType);
  console.log(req.body);

  switch (resourceType) {
    case 'subscription':
      try {
        const subscription = req.body.resource;
        const customerId = subscription.custom_id;

        let user;
        if (customerId) {
          user = await User.findById(customerId);
        } else if (subscription.subscriber?.payer_id) {
          user = await User.findOne({ 'paypal.payerId': subscription.subscriber.payer_id });
        }
        if (!user) {
          throw Error('user not found');
        }

        await processPayPalSubscriptionObject(user, subscription, eventType);

        break;
      } catch (err) {
        console.log(err);

        return res.status(500).json({
          success: false,
          error: err.message
        });
      }
    case 'sale':
      if (eventType === 'PAYMENT.SALE.COMPLETED') {
        try {
          const sale = req.body.resource;
          const userId = sale.custom; // N.B.: Here this is `custom`; not `custom_id`. 

          let user;
          if (userId) {
            user = await User.findById(userId);
          }
          if (!user) {
            throw Error('user not found');
          }

          const subscriptionId = sale.billing_agreement_id;
          let payment = await Payment.findOne(
            { subscriptionId, userId }, {}, { sort: { createdAt: -1 } }
          );
          // Sometimes, we don't receive BILLING.SUBSCRIPTION.CREATED so payment is not still created
          if (!payment) {
            payment = new Payment({ subscriptionId, userId });
          }

          payment.invoiceId = sale.id;
          payment.subtotal = sale.amount.details.subtotal;
          payment.total = sale.amount.total;
          payment.paid = true;

          await payment.save();

        } catch (err) {
          console.log(err);

          return res.status(500).json({
            success: false,
            error: err.message
          });
        }
      } else {
        break;
      }
    default:
      break;
  }

  res.status(200).json({
    success: true,
    data: {
    },
    message: 'Webhook updated successfully'
  });
};

// Cancel and refund only when 
// -- the user is currently on a non-FREE subscription (consider trial periods as free subscriptions), 
// -- and is cancelling it or switching to a FREE subscription. 

// User might have first subscribed to a package (STANDARD), then upgraded (PREMIUM) and then
// cancelled the package; in which case we need to consider non-refunded amounts of all the 
// payments he made, related to the subscription and refund in the reverse-chronological order. 
const makeStripeRefund = async (
  customerId: string,
  requestedAmount: number
): Promise<{ refunds: Stripe.Response<Stripe.Refund>[]; remaining: number }> => {
  const refunds: Stripe.Response<Stripe.Refund>[] = [];

  const paymentIntents = (
    await stripe.paymentIntents.list({ customer: customerId })
  ).data.filter(pi => pi.status === 'succeeded');
  paymentIntents.sort((a, b) => b.created - a.created); // descending 

  for (let i = 0; i < paymentIntents.length; i++) {
    const paymentIntent = paymentIntents[i];
    const lastCharge = paymentIntent.charges.data[0];
    if (!lastCharge) {
      continue;
    }

    // Amount that can be refunded from this payment
    const refundableAmount = lastCharge.amount_captured > requestedAmount
      ? requestedAmount
      : lastCharge.amount_captured;

    try {
      const refund = await stripe.refunds.create({
        reason: 'requested_by_customer', amount: refundableAmount, payment_intent: paymentIntent.id
      });
      refunds.push(refund);
    } catch (error) {
      console.log(`Refund failed for: ${error}`);

      continue; // not properly refunded so keep requestedAmount unchanged. 
    }

    // Remaining amount to be refunded
    requestedAmount = requestedAmount - refundableAmount;
    if (requestedAmount <= 0) {
      break; // Refunded the total requested amount. 
    }
  }

  return { refunds, remaining: requestedAmount };
};

const adjustStripeCustomerBalance = async (
  customerId: string,
  newBalance: number
) => {
  try {
    // balance = how much the customer owes screenapp
    const customer = await stripe.customers.update(customerId, { balance: newBalance });
  } catch (error) {
    console.log(`Error adjusting balance of customer ${customerId} to ${newBalance}.`);
  }
};

