/* eslint-disable @typescript-eslint/camelcase */

import { Response, Request, NextFunction } from 'express';
import validator from 'validator';
import { Feedback } from '../../../models/Feedback';
import { formatError } from '../../../util/error';
export const feedback = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validationErrors = [];
        if (!validator.isEmail(req.body.email)) {
            validationErrors.push('Please enter a valid email address');
        }

        if (validationErrors.length) {
            res.status(422).json(formatError(...validationErrors));
            return;
        }
        req.body.email = validator.normalizeEmail(req.body.email, {
            gmail_remove_dots: true
        });
        
        const feedback = new Feedback({
            name: req.body.name,
            email: req.body.email,
            feedback: req.body.feedback,
        });
        
        feedback.save();
        res.status(200).json('Feedback successfully submitted.');

    } catch (error) {
        next(error);
        res.status(400).json('Feedback submission failed.');
    }
};