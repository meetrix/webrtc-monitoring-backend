class Stripe {
  apiKey: string;
  constructor(apiKey: string, opts: any) {
    this.apiKey = apiKey;
  }
  customers = {
    create: () => {
      return Promise.resolve({
        id: '1234',
      });
    },
  };
}

export default Stripe;
