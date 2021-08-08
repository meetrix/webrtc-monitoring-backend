import https from 'https';

import {
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_REST_API_URL,
} from '../config/settings';

class PayPalRESTClient {
  tokenDetails: { expiry: Date; token: string } = undefined;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly apiUrl: string
  ) {}

  private getOAuth = (): Promise<any> => {
    return new Promise((resolve) => {
      const data = 'grant_type=client_credentials';

      const options = {
        hostname: this.apiUrl,
        port: 443,
        path: '/v1/oauth2/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.length,
          Authorization:
            'Basic ' +
            Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
              'base64'
            ),
        },
      };

      const processResponse = function (res: any): void {
        let str = '';

        res.on('data', function (chunk: string) {
          str += chunk;
        });

        res.on('end', function () {
          const obj = JSON.parse(str);
          resolve(obj);
        });
      };
      const request = https.request(options, processResponse);
      request.write(data);
      request.end();
    });
  };

  private retrieveAccessToken = async (): Promise<void> => {
    const { expires_in: expiry, access_token: token } =
      (await this.getOAuth()) as never;
    this.tokenDetails = {
      expiry: new Date(Date.now() + expiry * 1000 - 60000),
      token,
    };
  };

  private request = async (
    method: string,
    path: string,
    obj: any
  ): Promise<any> => {
    // Refresh access token if needed
    if (!this.tokenDetails || this.tokenDetails.expiry < new Date()) {
      await this.retrieveAccessToken();
    }

    const options = {
      hostname: this.apiUrl,
      port: 443,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.tokenDetails.token}`,
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, function (res) {
        let str = '';

        res.on('data', function (chunk: string) {
          str += chunk;
        });

        res.on('end', function () {
          const obj = JSON.parse(str);
          resolve(obj);
        });
      });

      if (!['HEAD', 'OPTIONS', 'GET'].includes(method)) {
        req.write(JSON.stringify(obj));
      }
      req.end();
    });
  };

  getSubscription = async (id: string): Promise<any> =>
    this.request('GET', `/v1/billing/subscriptions/${id}`, null);
}

export const payPalClient = new PayPalRESTClient(
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_REST_API_URL
);
