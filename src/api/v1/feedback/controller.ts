/* eslint-disable @typescript-eslint/camelcase */

import { Response, Request, NextFunction } from 'express';
import validator from 'validator';
import _ from 'lodash';
import crypto from 'crypto';
import { Feedback } from '../../../models/Feedback';
import { formatError } from '../../../util/error';
import { getMailOptions, getTransporter } from '../../../util/mail';
import { RECEIVER_EMAIL } from '../../../config/settings';
export const feedback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validationErrors = [];
    let { email } = req.body;
    if (!validator.isEmail(req.body.email)) {
      validationErrors.push('Please enter a valid email address.');
    }

    if (validationErrors.length) {
      //res.status(422).json(formatError(...validationErrors));
      res.status(422).json({
        success: false,
        data: null,
        message: 'Please enter a valid email address and try again.'
      });
      return;
    }

    email = validator.normalizeEmail(email, {
      gmail_remove_dots: true
    });

    const { name } = req.body;
    if (!name) {
      res.status(422).json({
        success: false,
        data: null,
        message: 'Please enter your name correctly.'
      });
      return;
    }

    const { feedback } = req.body;
    if (!feedback) {
      res.status(422).json({
        success: false,
        data: null,
        message: 'You should enter a feedback or message before submitting.'
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
      name,
      email,
      feedback,
      timestamp,
    });

    feedbackDocument.save();

    const transporter = getTransporter();

    // const timestamp = Date();
    const mailOptions = getMailOptions({
      subject: `ScreenApp Client Feedback [# ${clientId}]`,
      to: RECEIVER_EMAIL,
      template: 'feedbackEmail',
      context: {
        clientId,
        feedback: {
          name,
          email,
          feedback,
          timestamp,
        }
      }
    });

    await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      data: { clientId },
      message: 'Feedback successfully submitted. We will contact you via email shortly.'
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
