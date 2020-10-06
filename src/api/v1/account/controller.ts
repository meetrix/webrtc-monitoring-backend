/* eslint-disable @typescript-eslint/camelcase */
import crypto from 'crypto';
import passport from 'passport';
import validator from 'validator';
import nodemailer from 'nodemailer';
import { Response, Request, NextFunction } from 'express';
import { IVerifyOptions } from 'passport-local';

const log = console.log;

import { UserDocument, User } from '../../../models/User';
import { SENDGRID_USER, SENDGRID_PASSWORD } from '../../../config/secrets';
import {
    UNSUBSCRIBE_LANDING,
    RECOVERY_LANDING,
    CONFIRMATION_LANDING,
    SENDER_EMAIL,
} from '../../../config/settings';
import { formatError } from '../../../util/error';
import {
    passwordResetTemplate,
    passwordChangedConfirmationTemplate,
    mailConfirmationTemplate,
} from '../../../resources/emailTemplates';
import { SUCCESSFUL_RESPONSE } from '../../../util/success';
import { signToken } from '../../../util/auth';
import { token } from 'morgan';


export const refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = await User.findOne({ id: req.user.sub });
        if (!user) {
            res.sendStatus(401);
            return;
        }
        res.status(200).json({ token: signToken(user) });
    } catch (error) {
        next(error);
    }
};
export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validationErrors = [];
        if (!validator.isEmail(req.body.email)) {
            validationErrors.push('Please enter a valid email address');
        }
        if (!validator.isLength(req.body.password, { min: 8 })) {
            validationErrors.push(
                'Password must be at least 8 characters long'
            );
        }
        if (validationErrors.length) {
            res.status(422).json(formatError(...validationErrors));
            return;
        }
        req.body.email = validator.normalizeEmail(req.body.email, {
            gmail_remove_dots: false,
        });
        const existing = await User.findOne({ email: req.body.email });
        if (existing) {
            res.status(422).json(formatError('Account already exists'));
            return;
        }

        const user = new User({
            email: req.body.email,
            password: req.body.password,
            profile: {
                name: req.body.name,
            },
        });
        await user.save();
        require('dotenv').config();
        const registerToken = signToken(user);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTPEMAIL,
                pass: process.env.SMTPPASSWORD,
            },
        });

        const mailOptions = {
            from: '"ScreenApp.IO" <screenapp.io@gmail.com>',
            to: user.email,
            cc: '',
            subject: 'Confirm Your Email Address',
            html: mailConfirmationTemplate(
                `${CONFIRMATION_LANDING}/verify/?token=${registerToken}`,
            ),
            
        };

        transporter.sendMail(mailOptions, (err, data) => {
            if (err) {
                return log('Error occurs');
            }
            return log('Email sent to the user successfully.');
        });

        res.status(201).json({ token: signToken(user) });
    } catch (error) {
        next(error);
    }
};

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.body.email || !req.body.password) {
            res.status(403).json(formatError('Invalid credentials'));
            return;
        }
        req.body.email = validator.normalizeEmail(req.body.email, {
            gmail_remove_dots: false,
        });
        passport.authenticate(
            'local',
            (
                err: Error,
                user: UserDocument,
                info: IVerifyOptions
            ): Response => {
                if (err) throw err;
                if (!user) {
                    return res.status(403).json(formatError(info.message));
                }
                res.status(200).json({ token: signToken(user) });
            }
        )(req, res, next);
    } catch (error) {
        next(error);
    }
};
export const forgot = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.body.email) {
            res.status(422).json(formatError('Invalid data'));
            return;
        }
        req.body.email = validator.normalizeEmail(req.body.email, {
            gmail_remove_dots: false,
        });

        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            // res.status(404).json(formatError('Email not found'));
            res.status(404).json('Email Address not found in our system.');
            return;
        }
        const token = crypto.randomBytes(16).toString('hex');
        user.passwordResetToken = token;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // ms
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTPEMAIL,
                pass: process.env.SMTPPASSWORD,
            },
        });

        const mailOptions = {
            to: req.body.email,
            from: '"ScreenApp.IO" <SENDER_EMAIL>',
            subject: 'Password Reset Request - ScreenApp.IO',
            html: passwordResetTemplate(
                `${RECOVERY_LANDING}/reset/?token=${token}`,
            ),
        };

        await transporter.sendMail(mailOptions);
        // res.status(201).json(SUCCESSFUL_RESPONSE);
        // res.status(201).json({ token });
        res.status(201).json('Email has been sent with the reset token successfully.');
    } catch (error) {
        log('Error occurs while sending email.');
        next(error);
    }
};
export const reset = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validationErrors = [];
        if (!validator.isLength(req.body.password, { min: 8 })) {
            validationErrors.push(
                'Password must be at least 8 characters long'
            );
        }
        if (req.body.password !== req.body.confirm) {
            validationErrors.push('Passwords do not match');
        }
        if (!validator.isHexadecimal(req.params.token)) {
            validationErrors.push('Invalid token');
        }
        if (validationErrors.length) {
            res.status(422).json(formatError(...validationErrors));
            return;
        }

        const user = await User.findOne({
            passwordResetToken: req.params.token,
        })
            .where('passwordResetExpires')
            .gt(Date.now());
        if (!user) {
            res.status(422).json('Invalid token');
            
            return;
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTPEMAIL,
                pass: process.env.SMTPPASSWORD,
            },
        });

        const mailOptions = {
            to: user.email,
            from: '"ScreenApp.IO" <SENDER_EMAIL>',
            subject: 'Password Reset Successful - ScreenApp.IO',
            html: passwordChangedConfirmationTemplate(),
        };
        await transporter.sendMail(mailOptions);

        // res.status(201).json(SUCCESSFUL_RESPONSE);
        res.status(201).json('Password reset successful.');
    } catch (error) {
        next(error);
    }
};
export const postProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = await User.findOne({ id: req.user.sub });
        user.profile.name = req.body.name;
        user.profile.gender = req.body.gender;
        user.profile.location = req.body.location;
        user.profile.website = req.body.website;
        await user.save();
        res.status(200).json(user.format());
    } catch (error) {
        next(error);
    }
};
export const getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const user = await User.findOne({ id: req.user.sub });
        res.status(200).json(user.format());
    } catch (error) {
        next(error);
    }
};
export const password = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validationErrors = [];
        if (!validator.isLength(req.body.password, { min: 8 })) {
            validationErrors.push(
                'Password must be at least 8 characters long'
            );
        }
        if (req.body.password !== req.body.confirm) {
            validationErrors.push('Passwords do not match');
        }
        if (validationErrors.length) {
            res.status(422).json(formatError(...validationErrors));
            return;
        }
        const user = await User.findOne({ id: req.user.sub });
        user.password = req.body.password;
        await user.save();
        res.status(200).json(SUCCESSFUL_RESPONSE);
    } catch (error) {
        next(error);
    }
};
export const deleteAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        await User.deleteOne({ id: req.user.sub });
        res.status(200).json(SUCCESSFUL_RESPONSE);
    } catch (error) {
        next(error);
    }
};
