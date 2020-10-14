/* eslint-disable @typescript-eslint/camelcase */

import { Response, Request, NextFunction } from 'express';
import validator from 'validator';
import _ from 'lodash';
import crypto from 'crypto';
import { Feedback } from '../../../models/Feedback';
import { formatError } from '../../../util/error';
import { getMailOptions, getTransporter } from '../../../util/mail';

export const feedback = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validationErrors = [];
        const { name, feedback } = req.body;
        let { email } = req.body;
        if (!validator.isEmail(req.body.email)) {
            validationErrors.push('Please enter a valid email address.');
        }

        if (validationErrors.length) {
            res.status(422).json(formatError(...validationErrors));
            return;
        }
        email = validator.normalizeEmail(email, {
            gmail_remove_dots: true
        });

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
        res.status(201).json('Feedback successfully submitted. We will contact you via email shortly.');

    } catch (error) {
        next(error);
        res.status(422).json('Feedback submission failed. Please try again.');
    }
};
