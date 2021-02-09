/* eslint-disable @typescript-eslint/camelcase */

import { Response, Request, NextFunction } from 'express';
import validator from 'validator';
import _ from 'lodash';
import crypto from 'crypto';
import { Feedback } from '../../../models/Feedback';
import { getMailOptions, getTransporter } from '../../../util/mail';
import { RECEIVER_EMAIL } from '../../../config/settings';

const validateEmail = async (emailAddress: string): 
Promise<{ email: string | false; errors: string[] }> => {
  const validationErrors = [];
  if (!validator.isEmail(emailAddress)) {
    validationErrors.push('Please enter a valid email address.');
  }

  const emailNormalized = validator.normalizeEmail(emailAddress, {
    gmail_remove_dots: true
  });

  return { email: emailNormalized, errors:validationErrors };
};

export const feedback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validationErrors = [];

    const { email = '',  } = req.body;
    const { rating = 0, feedback = '', meta = {} }= req.body;

    // const emailValidated = await validateEmail(email);
    // validationErrors.push(emailValidated.errors);
    // email = emailValidated.email || email;

    if (validationErrors.length) {
      res.status(422).json({
        success: false,
        data: null,
        message: 'Please enter a valid email address and try again.'
      });
      return;
    }

    // Here we generate a random value of 8 charcaters as a clientID
    const randValueHex = (len: number): string => {
      return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
    };
    const clientId = randValueHex(8);

    // Here we get the time of feedback writing
    const timestamp = Date();

    const feedbackDocument = new Feedback({
      clientId,
      email,
      rating,
      feedback,
      timestamp,
      meta,
    });
    feedbackDocument.save();

    // Notify admins/developers only if there's non-empty feedback text
    if (!!feedback) {
      // console.log(`Feedback: ${feedback}`);
      const transporter = getTransporter();
      const mailOptions = getMailOptions({
        subject: `ScreenApp Client Feedback [# ${clientId}]`,
        to: RECEIVER_EMAIL,
        template: 'feedbackEmail',
        context: {
          clientId,
          feedback: {
            email,
            rating,
            feedback,
            timestamp,
          }
        }
      });
      await transporter.sendMail(mailOptions);
    }

    res.status(200).json({
      success: true,
      data: { clientId },
      message: 'Feedback successfully submitted. '
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Feedback submission failed. Please try again later.'
    });
    next(error);
  }
};
