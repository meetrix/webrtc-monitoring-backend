/* eslint-disable @typescript-eslint/no-explicit-any */

// jest.mock('nodemailer');
import bcrypt from 'bcrypt';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// import {} from '../../src/types/passport-user';

import {
  RegisterUserOptions,
  registerValidUser,
  GENERIC_UPLOAD_USER_ID,
  JWTPayload,
} from '../helpers';
import { initMongo, disconnectMongo, clearDB } from '../setup';
import { User, UserDocument } from '../../src/models/User';
import { SESSION_SECRET } from '../../src/config/secrets';
import { signToken } from '../../src/util/auth';

const mockedPutObject = jest.fn();
const mockedGetSignedUrl = jest.fn();
jest.mock('stripe');
jest.mock('aws-sdk/clients/s3', (): any => {
  return class S3 {
    public putObject(params: any): any {
      mockedPutObject(params);
      return {
        /* eslint-disable @typescript-eslint/no-empty-function */
        promise: async (): Promise<void> => {},
      };
    }
    public getSignedUrl(operation: string, params: any): string {
      mockedGetSignedUrl(operation, params);
      return 'https://dummy.url.com';
    }
  };
});

import app from '../../src/app';
describe('API V1', () => {
  beforeAll(async () => await initMongo());
  // beforeEach(async () => await clearDB());
  afterAll(async () => await disconnectMongo());

  describe('/v1/spec/', () => {
    describe('GET /', () => {
      it('should return 200 OK', async () => {
        const { status } = await request(app).get('/v1/spec/').expect(200);
        expect(status).toEqual(200);
      });
    });
  });

  describe('/upload', () => {
    const adminOpts: RegisterUserOptions = {
      role: 'admin',
      randomize: true,
    };

    const userOpts: RegisterUserOptions = {
      randomize: true,
    };

    describe('POST /', () => {
      beforeEach(async () => {
        mockedPutObject.mockClear();
        mockedGetSignedUrl.mockClear();
      });

      it('should return 201, the document added to storage and call s3.putObject, s3.getSignedUrl - one file', async () => {
        const token = await registerValidUser(adminOpts);
        const { body } = await request(app)
          .post('/v1/upload')
          .set('authorization', `Bearer ${token}`)
          .attach('file', 'test/integration/files/sample-white.png')
          .expect(201);

        expect(body.data[0].url).toEqual('https://dummy.url.com');
        expect(mockedPutObject).toHaveBeenCalled();
        expect(mockedGetSignedUrl).toHaveBeenCalled();
      });

      it('should return 201, the documents added to storage and call s3.putObject, s3.getSignedUrl twice - two files', async () => {
        const token = await registerValidUser(adminOpts);
        const { body } = await request(app)
          .post('/v1/upload')
          .set('authorization', `Bearer ${token}`)
          .attach('file', 'test/integration/files/sample-white.png')
          .attach('file', 'test/integration/files/sample-black.png')
          .expect(201);

        expect(body.data.length).toEqual(2);
        expect(body.data[1].url).toEqual('https://dummy.url.com');
        expect(mockedPutObject).toHaveBeenCalledTimes(2);
        expect(mockedGetSignedUrl).toHaveBeenCalledTimes(2);
      });

      it('should return 401 and not call s3.putObject, s3.getSignedUrl', async () => {
        const token = await registerValidUser(userOpts);
        await request(app)
          .post('/v1/upload')
          .set('authorization', `Bearer ${token}`)
          .attach('file', 'test/integration/files/sample-white.png')
          .attach('file', 'test/integration/files/sample-black.png')
          .expect(403);
        expect(mockedPutObject).toHaveBeenCalledTimes(0);
        expect(mockedGetSignedUrl).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('/users', () => {
    beforeAll(async () => await clearDB());
    const adminOpts: RegisterUserOptions = {
      role: 'admin',
      email: `${crypto.randomBytes(16).toString('hex')}@valid.com`,
    };

    describe('GET /', () => {
      it('should return a list of users', async () => {
        const token = await registerValidUser(adminOpts);
        const { body } = await request(app)
          .get('/v1/users/')
          .set('authorization', `Bearer ${token}`)
          .expect(200);
        expect(body?.data[0].email).toEqual(adminOpts.email);
      });
    });
  });

  describe('/account', () => {
    const REGISTER_VALID = {
      email: `${crypto.randomBytes(16).toString('hex')}@valid.com`,
      password: `${crypto.randomBytes(16).toString('hex')}`,
    };

    const REGISTER_INVALID_EMAIL_PASSWORD = {
      email: 'a@a.a',
      password: 'pass',
    };

    const REGISTER_VALID_NAME_EMAIL_PASSWORD = {
      email: 'valid@email.com',
      password: 'valid_password',
      name: 'valid name',
    };

    const getValidUserOpts: () => RegisterUserOptions = () => ({
      email: `${crypto.randomBytes(16).toString('hex')}@valid.com`,
      role: 'user',
      password: `${crypto.randomBytes(16).toString('hex')}`,
    });

    describe('GET /jwt/refresh', () => {
      it('should return a fresher JWT', async () => {
        const _token = await registerValidUser(getValidUserOpts());
        const payload = jwt.verify(_token, SESSION_SECRET) as JWTPayload;
        const expiringToken = signToken(
          {
            _id: payload.sub,
            email: payload.email,
            role: 'user',
          } as UserDocument,
          SESSION_SECRET,
          '1s'
        );
        const {
          body: {
            data: { token },
          },
        } = await request(app)
          .get('/v1/account/jwt/refresh')
          .set('authorization', `Bearer ${expiringToken}`);

        const freshPayload = jwt.verify(token, SESSION_SECRET) as JWTPayload;
        const oldPayload = jwt.verify(
          expiringToken,
          SESSION_SECRET
        ) as JWTPayload;
        expect(freshPayload.exp > oldPayload.exp).toBe(true);
      });

      it('should return 401 - token is valid but the user does not exist', async () => {
        const token = await registerValidUser(getValidUserOpts());
        await User.deleteMany({});
        const refresh = await request(app)
          .get('/v1/account/jwt/refresh')
          .set('authorization', `Bearer ${token}`);
        expect(refresh.status).toBe(401);
      });
    });

    describe('POST /register', () => {
      it('should return status 201, create a user send confirmation email - valid register', async () => {
        const response = await request(app)
          .post('/v1/account/register')
          .send(REGISTER_VALID);

        expect(response.status).toBe(201);
        // const payload = jwt.verify(response.body.data.token, SESSION_SECRET);
        // expect((payload as JWTPayload).email).toBe(REGISTER_VALID.email);
        expect(response.body.message).toEqual(
          'Confirmation email has been sent successfully. Please check your inbox to proceed.'
        );
      });

      it('should return status 201, create a user with a name', async () => {
        const response = await request(app)
          .post('/v1/account/register')
          .send(REGISTER_VALID_NAME_EMAIL_PASSWORD);

        const user = await User.findOne({
          email: REGISTER_VALID_NAME_EMAIL_PASSWORD.email,
        });

        expect(response.status).toBe(201);
        expect(user.profile.name).toBe(REGISTER_VALID_NAME_EMAIL_PASSWORD.name);
      });

      it('should return status 422 - invalid email and password', async () => {
        const { body } = await request(app)
          .post('/v1/account/register')
          .send(REGISTER_INVALID_EMAIL_PASSWORD)
          .expect(422);
        expect(body.message).toEqual('Please enter a valid email address.');
      });

      it('should return status 200 - unverified account', async () => {
        await request(app).post('/v1/account/register').send(REGISTER_VALID);
        const { body } = await request(app)
          .post('/v1/account/register')
          .send(REGISTER_VALID)
          .expect(200);
        expect(body.message).toEqual(
          'You have an unverifed account with us. Please verify your account & signin.'
        );
      });
    });

    describe('GET /verify', () => {
      it('should verify the account and return 200', async () => {
        const { emailToken } = await User.findOne({
          email: REGISTER_VALID.email,
        });
        const { body } = await request(app)
          .get(`/v1/account/verify?token=${emailToken}`)
          .expect(200);
      });
    });

    describe('POST /login', () => {
      it("should return status 200 and the user's JWT - valid login", async () => {
        // const validUserOptions = getValidUserOpts();
        // await registerValidUser(validUserOptions);
        const response = await request(app).post('/v1/account/login').send({
          email: REGISTER_VALID.email,
          password: REGISTER_VALID.password,
        });
        const payload = jwt.verify(response.body.data.token, SESSION_SECRET);
        expect(response.status).toBe(200);
        expect((payload as JWTPayload).email).toBe(REGISTER_VALID.email);
      });
      it('should return status 403 - email not registered', async () => {
        const { body } = await request(app)
          .post('/v1/account/login')
          .send(getValidUserOpts())
          .expect(403);
        expect(body.message).toEqual(
          'Username or password incorrect. If you forgot your credentials, please reset now.'
        );
      });
      it('should return status 403 - invalid credentials', async () => {
        await registerValidUser(getValidUserOpts());
        const { body } = await request(app)
          .post('/v1/account/login')
          .send({
            email: REGISTER_VALID.email,
            password: 'wrong_password',
          })
          .expect(403);
        expect(body.message).toEqual(
          'Username or password incorrect. If you forgot your credentials, please reset now.'
        );
      });
      it('should return status 403 - no payload', async () => {
        await registerValidUser(getValidUserOpts());
        const { body } = await request(app)
          .post('/v1/account/login')
          .send({})
          .expect(403);
        expect(body).toMatchSnapshot();
      });
    });

    describe('POST /forgot', () => {
      const validUserOpts = getValidUserOpts();
      let sendMailMock: jest.Mock;
      beforeEach(async () => {
        // sendMailMock = jest.fn();
        // (nodemailer.createTransport as jest.Mock).mockReturnValue({
        //   sendMail: sendMailMock,
        // });

        await clearDB();
        await registerValidUser(validUserOpts);
      });

      it('should return 201, set a password reset token and send an email', async () => {
        await request(app)
          .post('/v1/account/forgot')
          .send({ email: validUserOpts.email })
          .expect(201);

        const user = await User.findOne({ email: validUserOpts.email });
        expect(user.passwordResetToken).toBeDefined();
        // expect(sendMailMock).toHaveBeenCalled();
      });

      it('should return 422, does not set a password reset token or send an email - no data', async () => {
        const { body } = await request(app)
          .post('/v1/account/forgot')
          .send({})
          .expect(422);
        expect(body).toMatchSnapshot();
        const user = await User.findOne({});
        expect(user.passwordResetToken).toBeUndefined();
        // expect(sendMailMock).toBeCalledTimes(0);
      });

      it('should return 404, does not set a password reset token or send an email - email not registered', async () => {
        const { body } = await request(app)
          .post('/v1/account/forgot')
          .send({ email: 'not@registered.email' })
          .expect(404);
        expect(body).toMatchSnapshot();
        const user = await User.findOne({});
        expect(user.passwordResetToken).toBeUndefined();
        // expect(sendMailMock).toBeCalledTimes(0);
      });
    });

    describe('POST /reset/:token', () => {
      let sendMailMock: jest.Mock;
      const RESET_PASSWORD_VALID = {
        password: 'different_valid_password',
        confirm: 'different_valid_password',
      };
      const RESET_PASSWORD_INVALID = {
        password: 'pass',
        confirm: 'different_password',
      };
      const useOptsWitnPasswordResetToken = {
        email: 'valid1@email.com',
        password:
          '$2b$10$dn9jixNaX2WCvnVWBfW4aucSPTS41hzE9.A3n7QLPL4bkHQ.6eCqK',
        id: 'b27e8455-eac8-47c9-babc-8a8a6be5e4ae',
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
        passwordResetToken: '4ec7149e1c5d55721a9cb2b069c22ac0',
      };
      beforeAll(async () => {
        // sendMailMock = jest.fn();
        // (nodemailer.createTransport as jest.Mock).mockReturnValue({
        //   sendMail: sendMailMock,
        // });
        await User.create(useOptsWitnPasswordResetToken);
      });

      it('should return 201 and reset the password', async () => {
        // let user = await User.findOne({});
        await request(app)
          .post(
            `/v1/account/reset/${useOptsWitnPasswordResetToken.passwordResetToken}`
          )
          .send(RESET_PASSWORD_VALID)
          .expect(201);
        const user = await User.findOne({
          email: useOptsWitnPasswordResetToken.email,
        });
        // expect(sendMailMock).toHaveBeenCalled();
        expect(await user.authenticate(RESET_PASSWORD_VALID.password)).toBe(
          true
        );
      });

      it('should return 422 - password mismatch, password too short and invalid token', async () => {
        const { body } = await request(app)
          .post('/v1/account/reset/invalid_token')
          .send(RESET_PASSWORD_INVALID)
          .expect(422);
        expect(body.message).toEqual(
          'Password must be at least 6 characters long.'
        );
        // expect(sendMailMock).toBeCalledTimes(0);
      });

      it('should return 422 - expired token', async () => {
        const user = await User.findOne({});
        user.passwordResetExpires = new Date(Date.now() - 1000);
        await user.save();
        const { body } = await request(app)
          .post(`/v1/account/reset/${user.passwordResetExpires}`)
          .send(RESET_PASSWORD_VALID)
          .expect(422);
        expect(body.message).toEqual(
          'Token expired or something went wrong. Please try again.'
        );
        // expect(sendMailMock).toBeCalledTimes(0);
      });
    });

    describe('GET /profile', () => {
      it("should return 200 and the user's profile information", async () => {
        const validUserOpts = getValidUserOpts();
        const token = await registerValidUser(validUserOpts);
        const { body } = await request(app)
          .get('/v1/account/profile')
          .set('authorization', `Bearer ${token}`)
          .expect(200);
        expect(body.data.email).toEqual(validUserOpts.email);
      });

      it('should return 401 - invalid authorization token', async () => {
        await registerValidUser(getValidUserOpts());
        await request(app).get('/v1/account/profile').expect(401);
      });
    });

    describe('POST /profile', () => {
      const PROFILE_DATA = {
        name: 'Valid User',
        gender: 'User',
        location: 'Userland',
        domain: 'valid.user.com',
      };

      it("should return 200 and change the user's profile information", async () => {
        const validUserOpts = getValidUserOpts();
        const token = await registerValidUser(validUserOpts);
        await request(app)
          .post('/v1/account/profile')
          .set('authorization', `Bearer ${token}`)
          .send(PROFILE_DATA)
          .expect(200);
        const user = await User.findOne({ email: validUserOpts.email });
        expect(user.profile.name).toBe(PROFILE_DATA.name);
        expect(user.profile.gender).toBe(PROFILE_DATA.gender);
        expect(user.profile.location).toBe(PROFILE_DATA.location);
        expect(user.profile.domain).toBe(PROFILE_DATA.domain);
      });

      it('should return 200 and return the profile', async () => {
        const validUserOpts = getValidUserOpts();
        const token = await registerValidUser(validUserOpts);
        const { body } = await request(app)
          .post('/v1/account/profile')
          .set('authorization', `Bearer ${token}`)
          .send(PROFILE_DATA)
          .expect(200);
        expect(body.message).toBe('Profile successfully updated.');
      });

      it('should return 401 - invalid authorization token', async () => {
        const validUserOpts = getValidUserOpts();
        await registerValidUser(validUserOpts);
        await request(app)
          .post('/v1/account/profile')
          .send(PROFILE_DATA)
          .expect(401);
        const user = await User.findOne({});
        expect(user.profile.name).toBeUndefined();
        expect(user.profile.gender).toBeUndefined();
        expect(user.profile.location).toBeUndefined();
        expect(user.profile.domain).toBeUndefined();
      });
    });

    describe('POST /password', () => {
      const VALID_PASSWORD_PAYLOAD = {
        password: 'newValidPassword',
        confirm: 'newValidPassword',
      };

      const INVALID_PASSWORD_PAYLOAD = {
        password: 'short',
        confirm: 'wrong',
      };

      it("should return 200 and change the user's password", async () => {
        const validUserOpts = getValidUserOpts();
        const token = await registerValidUser(validUserOpts);
        await request(app)
          .post('/v1/account/password')
          .set('authorization', `Bearer ${token}`)
          .send(VALID_PASSWORD_PAYLOAD)
          .expect(200);
        const user = await User.findOne({ email: validUserOpts.email });
        expect(
          await bcrypt.compare(VALID_PASSWORD_PAYLOAD.password, user.password)
        ).toBe(true);
      });

      it('should return 401 - invalid authorization token', async () => {
        const validUserOpts = getValidUserOpts();
        await registerValidUser(validUserOpts);
        await request(app)
          .post('/v1/account/password')
          .set('authorization', 'Bearer invalid_token')
          .send(VALID_PASSWORD_PAYLOAD)
          .expect(401);
        const user = await User.findOne({ email: validUserOpts.email });
        expect(
          await bcrypt.compare(VALID_PASSWORD_PAYLOAD.password, user.password)
        ).toBe(false);
      });

      it('should return 422 - invalid data', async () => {
        const validUserOpts = getValidUserOpts();
        const token = await registerValidUser(validUserOpts);
        await request(app)
          .post('/v1/account/password')
          .set('authorization', `Bearer ${token}`)
          .send(INVALID_PASSWORD_PAYLOAD)
          .expect(422);
        const user = await User.findOne({ email: validUserOpts.email });
        expect(
          await bcrypt.compare(VALID_PASSWORD_PAYLOAD.password, user.password)
        ).toBe(false);
      });
    });

    describe('POST /delete', () => {
      it('should return 200 and delete the user', async () => {
        const validUserOpts = getValidUserOpts();
        const token = await registerValidUser(validUserOpts);
        await request(app)
          .post('/v1/account/delete')
          .set('authorization', `Bearer ${token}`)
          .expect(200);
        expect(await User.findOne({ email: validUserOpts.email })).toBeNull();
      });

      it('should return 401 - invalid authorization token', async () => {
        const validUserOpts = getValidUserOpts();
        await registerValidUser(validUserOpts);
        await request(app).post('/v1/account/delete').expect(401);
        expect(
          await User.findOne({ email: validUserOpts.email })
        ).toBeDefined();
      });
    });
  });
});
