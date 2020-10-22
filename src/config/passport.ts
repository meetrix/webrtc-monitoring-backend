import passport from 'passport';
import passportLocal from 'passport-local';
import { Express } from 'express';
import { OAuth2Strategy as GoogleAuthStratergy } from 'passport-google-oauth';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { User, UserDocument } from '../models/User';
import logger from '../util/logger';
import { GOOGLE_ID, GOOGLE_SECRET, FACEBOOK_ID, FACEBOOK_SECRET, LINKEDIN_API_KEY, LINKEDIN_SECRET } from './secrets';

const LocalStrategy = passportLocal.Strategy;

passport.serializeUser((user: { id: string }, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

const findUserOrCreateUser = async (profile: Passport.ExtendedProfile, accessToken: string, refreshToken: string): Promise<UserDocument> => {
  try {
    const { provider, id } = profile;
    const { name, email, picture } = profile._json;
    // 1. Lets see whether there are accounts for the any of the emails
    let user = await User.findOne({ email });
    logger.info(`Found registered user with email: ${email}`);

    if (user) return user;

    // 2. If we could not find any account with email, lets see whether there is an account with provider id
    user = await User.findOne({ [provider]: id });
    logger.info(`Found registered user with ${provider} id: ${id}`);

    if (user) return user;

    // 3. If we cannot find a user at all, we should create one
    logger.info('User not found. Creating a new user');
    user = new User({
      email,
      [provider]: id,
      profile: {
        name,
        picture,
      },
    });
    user.tokens.push({
      kind: provider,
      accessToken,
      refreshToken,
    });
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
    callbackURL: '/v1/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // return done(null);
      const user = await findUserOrCreateUser(profile, accessToken, refreshToken);
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
      callbackURL: '/v1/auth/facebook/callback',
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
        const user = await findUserOrCreateUser(profile, accessToken, refreshToken);
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
      callbackURL: '/v1/auth/linkedin/callback',
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
        const user = await findUserOrCreateUser(profile, accessToken, refreshToken);
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
