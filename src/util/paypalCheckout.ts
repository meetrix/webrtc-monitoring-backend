/**
 *
 * PayPal Node JS SDK dependency
 */
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

import {
  NODE_ENV,
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PRODUCTION
} from '../config/settings';

/**
 *
 * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
 * Staging uses SandboxEnvironment. In production, use LiveEnvironment.
 *
 */
function environment() {
  const clientId = PAYPAL_CLIENT_ID;
  const clientSecret = PAYPAL_CLIENT_SECRET;

  if (NODE_ENV === PRODUCTION) {
    return new checkoutNodeJssdk.core.LiveEnvironment(
      clientId, clientSecret
    );
  } else {
    return new checkoutNodeJssdk.core.SandboxEnvironment(
      clientId, clientSecret
    );
  }
}


/**
 *
 * Returns PayPal HTTP client instance with environment that has access
 * credentials context. Use this instance to invoke PayPal APIs, provided the
 * credentials have access.
 */
export function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function prettyPrint(jsonData: any, pre = ''): Promise<string> {
  let pretty = '';

  for (const key in jsonData) {
    if (jsonData.hasOwnProperty(key)) {
      if (isNaN(key as unknown as number))
        pretty += pre + capitalize(key) + ': ';
      else
        pretty += pre + (parseInt(key) + 1) + ': ';
      if (typeof jsonData[key] === 'object') {
        pretty += '\n';
        pretty += await prettyPrint(jsonData[key], pre + '    ');
      }
      else {
        pretty += jsonData[key] + '\n';
      }
    }
  }

  return pretty;
}

