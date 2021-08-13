import {
  handleMissing,
  isAuthenticated,
  hasRoleOrHigher,
  handleErrors,
} from '../../src/middleware';
import { signToken } from '../../src/util/auth';
import { UserDocument } from '../../src/models/User';
jest.mock('../../src/models/User');

/* eslint-disable @typescript-eslint/no-explicit-any */

const mockResponse = (): any => {
  const res: any = {};
  res.sendStatus = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Middlewares', () => {
  describe('404 handler', () => {
    it('should return status 404', () => {
      const res = mockResponse();
      handleMissing({} as any, res);
      expect(res.sendStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('error handler', () => {
    it('should return status 500 and Server Error message', () => {
      const res = mockResponse();
      handleErrors({} as any, {} as any, res, {} as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        errors: [{ msg: 'Server Error' }],
      });
    });
  });

  const EXPIRED_USER_TOKEN =
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InZhbGlkQGVtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNTY1MjU5ODc2LCJleHAiOjE1NjUyNTk4NzcsInN1YiI6ImMwODFmY2QyLTUyMGItNGNkMS04ZjBiLTUxN2ZhNzdmZmU0YyJ9.pG9kAXGIAecuhbzejy08-uMntZT94u-8BV1LQgPRFJo';
  const EXPIRED_ADMIN_TOKEN =
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InZhbGlkQGVtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTU2NTI1OTg3NiwiZXhwIjoxNTY1MjU5ODc3LCJzdWIiOiJjMDgxZmNkMi01MjBiLTRjZDEtOGYwYi01MTdmYTc3ZmZlNGMifQ.iGhhlgB6gh5usj90s92RQyEsBjhU7yzn6Y8YrxSPtJY';

  const VALID_USER_TOKEN = `Bearer ${signToken({
    email: 'user@meetrix.io',
    role: 'user',
    _id: 1234,
  } as UserDocument)}`;
  const VALID_ADMIN_TOKEN = `Bearer ${signToken({
    email: 'user@meetrix.io',
    role: 'admin',
    _id: 1234,
  } as UserDocument)}`;

  describe('isAuthenticated', () => {
    it('should call next()', async () => {
      const req: any = {
        headers: { authorization: VALID_USER_TOKEN },
      };
      const res = mockResponse();
      const nextMock = jest.fn();
      await isAuthenticated(req, res, nextMock);
      expect(nextMock).toHaveBeenCalled();
    });
    it('should return status 401 - expired token', async () => {
      const req: any = {
        headers: { authorization: EXPIRED_USER_TOKEN },
      };
      const res = mockResponse();
      const nextMock = jest.fn();
      await isAuthenticated(req, res, nextMock);
      expect(res.sendStatus).toHaveBeenCalledWith(401);
      expect(nextMock).toBeCalledTimes(0);
    });
    it('should return status 401 - missing authorization header', async () => {
      const req: any = { headers: {} };
      const res = mockResponse();
      const nextMock = jest.fn();
      await isAuthenticated(req, res, nextMock);
      expect(res.sendStatus).toHaveBeenCalledWith(401);
      expect(nextMock).toBeCalledTimes(0);
    });
  });

  describe('hasRoleOrHigher', () => {
    it('should call next() - token needs admin role - has admin role', () => {
      const req: any = {
        headers: { authorization: VALID_ADMIN_TOKEN },
      };
      const res = mockResponse();
      const nextMock = jest.fn();
      hasRoleOrHigher('admin')(req, res, nextMock);
      expect(nextMock).toHaveBeenCalled();
    });
    it('should call next() - token needs user role - has admin role', () => {
      const req: any = {
        headers: { authorization: VALID_ADMIN_TOKEN },
      };
      const res = mockResponse();
      const nextMock = jest.fn();
      hasRoleOrHigher('user')(req, res, nextMock);
      expect(nextMock).toHaveBeenCalled();
    });
    it('should call next() - token needs user role - has user role', () => {
      const req: any = {
        headers: { authorization: VALID_USER_TOKEN },
      };
      const res = mockResponse();
      const nextMock = jest.fn();
      hasRoleOrHigher('user')(req, res, nextMock);
      expect(nextMock).toHaveBeenCalled();
    });
    it('should return 401 - token needs admin role - has admin role but token is expired', () => {
      const req: any = {
        headers: { authorization: EXPIRED_ADMIN_TOKEN },
      };
      const res = mockResponse();
      const nextMock = jest.fn();
      hasRoleOrHigher('admin')(req, res, nextMock);
      expect(res.sendStatus).toHaveBeenCalledWith(401);
      expect(nextMock).toBeCalledTimes(0);
    });
    it('should return 403 - token needs admin role - has user role', () => {
      const req: any = {
        headers: { authorization: VALID_USER_TOKEN },
      };
      const res = mockResponse();
      const nextMock = jest.fn();
      hasRoleOrHigher('admin')(req, res, nextMock);
      expect(res.sendStatus).toHaveBeenCalledWith(403);
      expect(nextMock).toBeCalledTimes(0);
    });
    it('should return 401 when the authorization header is missing', () => {
      const req: any = { headers: {} };
      const res = mockResponse();
      const nextMock = jest.fn();
      hasRoleOrHigher('admin')(req, res, nextMock);
      expect(res.sendStatus).toHaveBeenCalledWith(401);
      expect(nextMock).toBeCalledTimes(0);
    });
  });
});
