import passport from 'passport';
import passportLocal from 'passport-local';
import { Express, Request } from 'express';
import { User, UserDocument } from '../models/User';
import logger from '../util/logger';

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

export const setupPassport = (app: Express): void => {
  app.use(passport.initialize());
};
