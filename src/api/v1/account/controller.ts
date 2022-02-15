/* eslint-disable @typescript-eslint/camelcase */
import crypto from 'crypto';
import passport from 'passport';
import validator from 'validator';
import { Response, Request, NextFunction } from 'express';
import { IVerifyOptions } from 'passport-local';
import {
  AUTH_LANDING,
  API_BASE_URL,
  SUPPORT_URL,
  S3_USER_META_BUCKET,
} from '../../../config/settings';

import { UserDocument, User } from '../../../models/User';
import { formatError } from '../../../util/error';
import { getSubscriptionStatus, signToken } from '../../../util/auth';
import { AWS_ACCESS_KEY, AWS_ACCESS_KEY_SECRET } from '../../../config/secrets';
import logger from '../../../util/logger';

// Refresh
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      //res.sendStatus(401);
      res.status(401).json({
        success: false,
        data: null,
        message: 'Unauthorized action.',
      });
      return;
    }
    // res.status(200).json({ token: signToken(user) });
    res.status(200).json({
      success: true,
      data: { token: signToken(user) },
      message: 'Token issued.',
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Something went wrong. Please try again later.',
    });

    next(error);
  }
};

// Register

export const register = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // if (!validator.isEmpty(req.body.name)) {
    //   res.status(422).json({
    //     success: false,
    //     data: null,
    //     message: 'Please enter your name correctly.'
    //   });
    //   return;
    // }

    if (!validator.isEmail(req.body.email)) {
      res.status(422).json({
        success: false,
        data: null,
        message: 'Please enter a valid email address.',
      });
      return;
    }
    if (!validator.isLength(req.body.password, { min: 6 })) {
      res.status(422).json({
        success: false,
        data: null,
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    req.body.email = validator.normalizeEmail(req.body.email, {
      gmail_remove_dots: false,
    });
    const selectedUser = await User.findOne({ email: req.body.email });

    if (!selectedUser) {
      const randValueHex = (len: number): string => {
        return crypto
          .randomBytes(Math.ceil(len / 2))
          .toString('hex')
          .slice(0, len);
      };
      const emailToken = randValueHex(32);

      const user = new User({
        email: req.body.email,
        password: req.body.password,
        profile: {
          name: req.body.name,
          picture: null,
          provider: 'manual',
          providerId: null,
        },
        tag: {
          tagId: null,
          title: null,
          status: null,
          createdAt: null,
        },

        emailToken,
        isVerified: false,
      });
      await user.save();

      const clientName = user.profile.name;

      res.status(201).json({
        success: true,
        // data: { emailToken },
        message:
          'Confirmation email has been sent successfully. Please check your inbox to proceed.',
      });
      return;
    }

    if (!selectedUser.isVerified) {
      res.status(200).json({
        success: true,
        data: null,
        message:
          'You have an unverifed account with us. Please verify your account & signin.',
      });
      return;
    } else if (selectedUser.isVerified) {
      res.status(200).json({
        success: true,
        data: null,
        message:
          'You have a verified account with us. Please signin or reset your credentials to continue.',
      });
      return;
    }
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Registration failed. Please try again in few minutes.',
    });
    next(error);
  }
};


// Login
export const login = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // if (!req.body.email || !req.body.password) {
    //   //res.status(403).json(formatError('Username or Password incorrect. Please check and try again.'));
    //   res.status(403).json(formatError('Invalid credentials'));
    //         return;

    // }

    if (!req?.body?.email || !req?.body?.password) {
      res.status(403).json({
        errors: [{ msg: 'Invalid credentials' }],
      });
      return;
    }
    req.body.email = validator.normalizeEmail(req.body.email, {
      gmail_remove_dots: false,
    });
    passport.authenticate(
      'local',
      async (
        err: Error,
        user: UserDocument,
        info: IVerifyOptions
      ): Promise<Response> => {
        if (err) throw err;

        // Let's check username or password is matched
        if (!user.email || !user.password) {
          // return res.status(403).json(formatError(info.message));
          return res.status(403).json({
            success: false,
            data: null,
            message:
              'Username or password incorrect. If you forgot your credentials, please reset now.',
          });
        }

        // Let's check user is verifed in the system
        if (!user.isVerified) {
          //Let's generate a string for emailToken
          const randValueHex = (len: number): string => {
            return crypto
              .randomBytes(Math.ceil(len / 2))
              .toString('hex')
              .slice(0, len);
          };
          const emailToken = randValueHex(32);

          // Let's update new emailToken and verification status for existing users
          (user.emailToken = emailToken),
            (user.isVerified = false),
            await user.save();

          const clientName = user.profile.name;

          res.status(403).json({
            success: false,
            // data: { emailToken },
            message:
              'You should complete your signin process. We have sent you a new confirmation email. Please check your inbox & confirm your account to continue.',
          });

          return;
        }

        if (user.isVerified) {
          // res.status(200).json({ token: signToken(user) });
          res.status(200).json({
            success: true,
            data: { token: signToken(user) },
            message: 'Login Successful. Redirecting...',
          });
        }
      }
    )(req, res, next);
  } catch (error) {
    console.log(error);
    logger.error(error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Something went wrong. Please try again later.',
    });
    next(error);
  }
};

// Forgot Password (Password Reset)
export const forgot = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.body.email) {
      res.status(422).json({
        errors: [{ msg: 'Invalid data' }],
      });
      return;
    }
    let { email } = req.body;
    email = validator.normalizeEmail(email, {
      gmail_remove_dots: false,
    });

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        errors: [
          {
            msg: 'Email not found',
          },
        ],
      });
      return;
    }

    const emailToken = crypto.randomBytes(16).toString('hex');
    user.passwordResetToken = emailToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // ms
    await user.save();

    const clientName = user.profile.name;

    res.status(201).json({
      success: true,
      message:
        'Password reset link has been sent to your mail successfully. It will be valid for next 60 minutes.',
    });
  } catch (error) {
    logger.error('Error occurs while sending email.');
    res.status(500).json({
      success: true,
      data: null,
      message: 'Something went wrong. Please try again later.',
    });
    next(error);
  }
};

// Password Reset Auth
export const resetPassword = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findOne({ passwordResetToken: req.query.token });
    if (!user) {
      // res.redirect(`${AUTH_LANDING}/#/resetpasswordtoken_expired`);
      res.status(401).json({
        success: false,
        data: null,
        message:
          'The password reset link is already used or expired. Please try again.',
      });
      return;
    }

    // res.redirect(`${AUTH_LANDING}/#/resetpassword?token=${user.passwordResetToken}`);

    res.status(200).json({
      success: true,
      data: { passwordResetToken: user.passwordResetToken },
      message: 'Reset successful. Redirecting...',
    });
  } catch (error) {
    logger.error('Something went wrong.');
    res.status(500).json({
      success: false,
      data: null,
      message: 'Something went wrong. Please try again later.',
    });
    next(error);
  }
};

// Password Reset Confirmation
export const reset = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!validator.isLength(req.body.password, { min: 6 })) {
      res.status(422).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }
    if (req.body.password !== req.body.confirm) {
      res.status(422).json({
        success: false,
        message:
          'Passwords do not match. Please check and enter the same password.',
      });
      return;
    }
    if (!validator.isHexadecimal(req.params.token)) {
      res.status(422).json({
        success: false,
        message: 'Token expired or something went wrong. Please try again.',
      });
      return;
    }

    const user = await User.findOne({
      passwordResetToken: req.params.token,
    })
      .where('passwordResetExpires')
      .gt(Date.now());
    if (!user) {
      res.redirect(`${AUTH_LANDING}/#/resetpasswordtoken_expired`);
      res.status(401).json({
        success: false,
        message:
          'The password reset link is already used or expired. Please try again.',
      });
      return;
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const clientName = user.profile.name;

    // res.status(201).json(SUCCESSFUL_RESPONSE);
    res.status(201).json({
      success: true,
      data: null,
      message:
        'Password reset successful. Sign in back to access your account.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Something went wrong. Please try again later.',
    });
    next(error);
  }
};

export const clearFirstTimeUserFlag = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    user.isFirstTimeUser = false;
    await user.save();

    res.status(200).json({
      success: true,
      data: null,
      message: 'Profile successfully updated.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Something went wrong. Please try again later.',
    });
    next(error);
  }
};

// Post Profile
export const postProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    // Do not set email
    // user.email = req.body.email;
    const { name, gender, location, domain, picture, provider, providerId } =
      req.body;

    user.profile = {
      ...user.profile,
      name,
      gender,
      location,
      domain,
      picture,
      provider,
      providerId,
    };

    if (req.body.picture) {
      const imgBuffer = Buffer.from(req.body.picture, 'base64');
      const emailHex = Buffer.from(user.email).toString('hex');
      const key = `profile-pictures/${emailHex}`; // Replace profile picture if exists
      const imgPath = '';
      user.profile.picture = imgPath;
    }

    if (!!req.body.password && req.body.password.length > 0) {
      // Validate old password, if only there is an old password
      if (
        user.password &&
        !(await user.authenticate(req.body.oldPassword || ''))
      ) {
        res.status(422).json({
          success: false,
          data: null,
          message: 'Current password entered is incorrect.',
        });
        return;
      }

      // Validate new password
      if (!validator.isLength(req.body.password, { min: 6 })) {
        res.status(422).json({
          success: false,
          data: null,
          message: 'Password must be at least 6 characters long.',
        });
        return;
      }

      user.password = req.body.password;

      //Password change notification

      const clientName = user.profile.name;
    }

    await user.save();
    //res.status(200).json(user.format());
    res.status(200).json({
      success: true,
      data: null,
      message: 'Profile successfully updated.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Something went wrong. Please try again later.',
    });
    next(error);
  }
};

// Get Profile
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    //res.status(200).json(user.format());
    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        isVerified: user.isVerified,
        isFirstTimeUser: user.isFirstTimeUser,
        hasPasswordSet: !!user.password,
        email: user.email,
        role: user.role,
        package: user.package,
        limitedPackage: user.limitedPackage,
        trialsConsumed: user.trialsConsumed,
        features: user.features,
        avatar: user.gravatar,
        profile: user.profile,
        ...getSubscriptionStatus(user),
        tag: user.tag,
      },
      message: 'Get profile successful.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Something went wrong. Please try again later.',
    });
    next(error);
  }
};

// Change Password
export const password = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validationErrors = [];
    if (!validator.isLength(req.body.password, { min: 8 })) {
      validationErrors.push('Password must be at least 8 characters long');
    }
    if (req.body.password !== req.body.confirm) {
      validationErrors.push('Passwords do not match');
    }
    if (validationErrors.length) {
      res.status(422).json(formatError(...validationErrors));
      return;
    }
    const user = req.user;
    user.password = req.body.password;
    await user.save();
    // res.status(200).json(SUCCESSFUL_RESPONSE);
    res.status(200).json({
      success: true,
      data: null,
      message: 'Changing password successful.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Something went wrong. Please try again later.',
    });
    next(error);
  }
};

// Delete Account
export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await User.deleteOne({ _id: req.user._id.toString() });
    //res.status(200).json(SUCCESSFUL_RESPONSE);
    res.status(200).json({
      success: true,
      data: null,
      message: 'Deleting profile successful.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Something went wrong. Please try again later.',
    });
    next(error);
  }
};

// Resend Verification
// export const resendVerification = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {

//     const getUserById = await User.findOne({ id: req.body.id });
//     const checkVerificationStatus = getUserById.isVerified === true;
//     if (checkVerificationStatus) {
//       res.status(422).json({
//         success: false,
//         data: null,
//         message: 'Already Verified.'
//       });
//       return;
//     }

//     // we create a random string to send as the token for email verification
//     const randValueHex = (len: number): string => {
//       return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
//     };
//     const emailToken = randValueHex(128);

//     const user = new User({
//       emailToken,
//       isVerified: false,
//     });
//     await user.save();

//     const transporter = getTransporter();

//     const mailOptions = getMailOptions({
//       subject: 'Confirm Your Email Address - ScreenApp.IO',
//       to: `<${user.email}>`,
//       template: 'emailVerification',
//       context: {
//         emailToken,
//         API_BASE_URL,
//         AUTH_LANDING
//       }
//     });

//     transporter.sendMail(mailOptions, (err, data) => {
//       if (err) {
//         return log('Error occurs');
//       }
//       return log('Email sent to the user successfully.');
//       // res.status(201).json({ token: signToken(user) });
//     });
//     res.status(200).json({
//       success: true,
//       data: { emailToken },
//       message: 'Confirmation email has been sent successfully. Please check your inbox to proceed.'
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       data: null,
//       message: 'Registration failed. Please try again in few minutes.'
//     });
//     next(error);
//   }
// };
