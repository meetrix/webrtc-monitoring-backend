const transporter = {
  use: (mode: string, template: any) => ({}),
  sendMail: (opts: any, callback: any) => callback(),
};

const nodemailer = {
  createTransport: () => {
    // transporter
    return transporter;
  },
};

export default nodemailer;
