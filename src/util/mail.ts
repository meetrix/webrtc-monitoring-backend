import nodemailer, { SendMailOptions, Transporter } from 'nodemailer';
import path from 'path';
import hbs from 'nodemailer-express-handlebars';
import { SMTP_HOST, SMTP_USER, SMTP_PASSWORD } from '../config/secrets';
import { RECEIVER_EMAIL, SENDER_EMAIL } from '../config/settings';

interface ExtendedSendMailOptions extends SendMailOptions {
  template: string;
  context: any;
}
export const getMailOptions = (options: ExtendedSendMailOptions): ExtendedSendMailOptions => ({
  from: `"ScreenApp.IO Messenger" <${SENDER_EMAIL}>`,
  to: RECEIVER_EMAIL,
  subject: 'Welcome to ScreenApp!',
  ...options

});

export const getTransporter = (): Transporter => {

  const viewOptions = {
    viewEngine: {
      extName: '.handlebars',
      partialsDir: path.resolve(__dirname, '../../src/templates'),
      defaultLayout: false
    },
    viewPath: path.resolve(__dirname, '../../src/templates'),
    extName: '.handlebars'
  };

  const transporter = nodemailer.createTransport({
    service: 'aws',
    host: SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
  transporter.use('compile', hbs(viewOptions));
  return transporter;
};
