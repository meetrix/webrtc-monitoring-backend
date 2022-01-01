import passport from 'passport';
import passportLocal from 'passport-local';
import { Express, Request } from 'express';
import { OAuth2Strategy as GoogleAuthStratergy } from 'passport-google-oauth';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { User, UserDocument } from '../models/User';
import logger from '../util/logger';
import {
  GOOGLE_ID,
  GOOGLE_SECRET,
  FACEBOOK_ID,
  FACEBOOK_SECRET,
  LINKEDIN_API_KEY,
  LINKEDIN_SECRET,
} from './secrets';
import Stripe from 'stripe';
import { API_BASE_URL, STRIPE_SECRET_KEY } from './settings';
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

export interface AuthAwareRequest extends Request {
  user: UserDocument;
}

const LocalStrategy = passportLocal.Strategy;

passport.serializeUser((user: { id: string }, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err: any, user: UserDocument) => {
    done(err, user);
  });
});

const findUserOrCreateUser = async (
  profile: Passport.ExtendedProfile,
  accessToken: string,
  refreshToken: string
): Promise<UserDocument> => {
  try {
    const { provider, id, name, emails, photos, displayName } = profile;
    const { givenName, middleName, familyName } = name;

    // Sometimes, a name might be empty.
    const fullName =
      displayName ||
      [givenName, familyName].filter((s) => !!s).join(' ') ||
      middleName ||
      '';

    const email = emails[0].value;
    //let email = '';
    let picture = null;
    //if (emails && emails[0]) {
    //}
    if (photos && photos[0]) {
      picture = photos[0].value;
    }

    // 1. Lets see whether there are accounts for the any of the emails
    let user = await User.findOne({ email });
    logger.info(`Found registered user with email: ${email}`);

    if (user) return user;

    // 2. If we could not find any account with email, lets see whether there is an account with provider id
    // we dont want this for now

    //user = await User.findOne({ 'profile.provider': provider, 'profile.providerId': id });
    //logger.info(`Found registered user with ${provider} id: ${id}`);

    //if (user) return user;

    // 3. If we cannot find a user at all, we should create one
    logger.info('User not found. Creating a new user');
    user = new User({
      email,
      profile: {
        name: fullName,
        picture,
        provider,
        providerId: id,
      },
    });
    user.tokens.push({
      kind: provider,
      accessToken,
      refreshToken,
    });
    await user.save();

    const customer = await stripe.customers.create({
      email: user.email,
      name: fullName,
      metadata: {
        userId: user._id.toString(),
      },
    });
    user.stripe.customerId = customer.id;

    await user.save();
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Sign in using Email and Password.
 */
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done): Promise<void> => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          return done(null, false, {
            message: 'Email not registered',
          });
        }

        if (!(await user.authenticate(password))) {
          return done(null, false, {
            message: 'Invalid credentials',
          });
        }

        done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

const googleStrategyConfig = new GoogleAuthStratergy(
  {
    clientID: GOOGLE_ID,
    clientSecret: GOOGLE_SECRET,
    callbackURL: `${API_BASE_URL}/auth/google/callback`,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      //console.log(profile);
      const user = await findUserOrCreateUser(
        profile,
        accessToken,
        refreshToken
      );
      return done(null, user);
    } catch (error) {
      done(error);
    }
  }
);

passport.use('google', googleStrategyConfig);

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Sign in with Facebook.
 */
passport.use(
  new FacebookStrategy(
    {
      clientID: FACEBOOK_ID,
      clientSecret: FACEBOOK_SECRET,
      callbackURL: `${API_BASE_URL}/auth/facebook/callback`,
      profileFields: [
        'name',
        'email',
        'link',
        'locale',
        'timezone',
        'picture.type(small)',
      ],
      passReqToCallback: true,
    },
    async (
      req: any,
      accessToken: string,
      refreshToken: string,
      profile: Passport.ExtendedProfile,
      done: Function
    ): Promise<void> => {
      try {
        //console.log(profile);
        const user = await findUserOrCreateUser(
          profile,
          accessToken,
          refreshToken
        );
        return done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

/**
 * Sign in with LinkedIn.
 */
passport.use(
  new LinkedInStrategy(
    {
      clientID: LINKEDIN_API_KEY,
      clientSecret: LINKEDIN_SECRET,
      callbackURL: `${API_BASE_URL}/auth/linkedin/callback`,
      profileFields: ['name', 'email', 'link', 'locale', 'timezone'],
      passReqToCallback: true,
    },
    async (
      req: any,
      accessToken: string,
      refreshToken: string,
      profile: Passport.ExtendedProfile,
      done: Function
    ): Promise<void> => {
      try {
        //console.log(profile);
        const user = await findUserOrCreateUser(
          profile,
          accessToken,
          refreshToken
        );
        return done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

export const setupPassport = (app: Express): void => {
  app.use(passport.initialize());
};
