import mongoose, { Schema } from 'mongoose';

export type PaymentDocument = mongoose.Document & {
  provider: string; // whether paypal or stripe
  invoiceId: string; // sale.id [paypal]
  subscriptionId: string;
  attemptCount: number;
  billingReason: string;
  collectionMethod: string;
  userId: string;
  customerId: string; // subscription.subscriber.payer_id [paypal]
  customerEmail: string; // subscription.subscriber.email_address [paypal]
  hostedInvoiceUrl: string;
  invoicePdf: string;
  subscriptionItemId: string;
  priceId: string; // subscription.plan_id [paypal]
  plan: string;
  paid: boolean;
  status: string;
  currency: string;
  amountDue: number;
  amountPaid: number;
  subtotal: number;
  total: number;
};

const paymentSchema = new mongoose.Schema(
  {
    provider: String,
    invoiceId: String,
    subscriptionId: String,
    attemptCount: Number,
    billingReason: String,
    collectionMethod: String,
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    customerId: String,
    customerEmail: String,
    hostedInvoiceUrl: String,
    invoicePdf: String,
    subscriptionItemId: String,
    priceId: String,
    plan: String,
    paid: Boolean,
    status: String,
    currency: String,
    amountDue: Number,
    amountPaid: Number,
    subtotal: Number,
    total: Number,
  },
  { timestamps: true }
);

paymentSchema.methods = {

};

export const Payment = mongoose.model<PaymentDocument>('Payment', paymentSchema);
