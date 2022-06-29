import request from 'supertest';

import { registerValidUser } from '../helpers';
import { clearDB, disconnectMongo, initMongo } from '../setup';
import app from '../../src/app';

describe('Troubleshooter', () => {
  beforeAll(async () => await initMongo());
  afterAll(async () => await disconnectMongo());

  describe('/troubleshooter', () => {
    let token = '';
    beforeAll(async () => {
      await clearDB();
      token = await registerValidUser({ jwtExpiration: '1d' });
    });

    describe('POST /troubleshooter', () => {
      it('should return 401 unauthorized when has no bearer token', async () => {
        const response = await request(app)
          .post('/v1/troubleshooter')
          // No auth
          .send({})
          .expect(401);

        expect(response.body).toEqual({
          success: false,
          error: 'No authentication token provided.',
        });
      });

      it('should return 403 forbidden when using user token', async () => {
        const response = await request(app)
          .post('/v1/troubleshooter')
          .set('authorization', `Bearer ${token}`)
          .send({})
          .expect(403);

        expect(response.body).toEqual({
          success: false,
          error: 'Invalid token',
        });
      });

      it('should return 401 when using token for nonexistent plugin', async () => {
        console.log(process.env.SESSION_SECRET);
        const invalidToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbHVnaW4iOiI2Mjg0YWVjNThlNTliOWU0YTFiZGMzNmMiLCJkb21haW4iOiJtZWV0cml4LmlvIiwiaWF0IjoxNjU1ODE3NTg3LCJleHAiOjE2NTU5OTAzODcsInN1YiI6IjYyODRhZTU3YmVjNjUzNjM5M2IwZWQwOCJ9.Vv0lFKoo2oWFO36QTY12UhALbZ2AehhvJsqynrzoHuY';
        const response = await request(app)
          .post('/v1/troubleshooter')
          .set('authorization', `Bearer ${invalidToken}`)
          .send({})
          .expect(401);

        expect(response.body).toEqual({
          success: false,
          error: 'App token not found.',
        });
      });

      it('should return 400 when clientId is not set', async () => {
        const plugin = {
          domain: 'domain.xyz',
        };

        const {
          body: {
            data: { _id: pluginId },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin)
          .expect(201);

        const {
          body: { data: pluginToken },
        } = await request(app).get(`/v1/plugins/${pluginId}/token`).expect(200);
        expect(pluginToken).toBeDefined();

        const response = await request(app)
          .post('/v1/troubleshooter')
          .set('authorization', `Bearer ${pluginToken}`)
          .send({})
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: 'No clientId set',
        });
      });

      it('should return 201 when some data is submitted with proper auth', async () => {
        const plugin = {
          domain: 'client-id.xyz',
        };

        const {
          body: {
            data: { _id: pluginId },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin)
          .expect(201);

        const {
          body: { data: pluginToken },
        } = await request(app).get(`/v1/plugins/${pluginId}/token`).expect(200);
        expect(pluginToken).toBeDefined();

        const response = await request(app)
          .post('/v1/troubleshooter')
          .set('authorization', `Bearer ${pluginToken}`)
          .set('x-client-id', 'test')
          .send({})
          .expect(201);

        expect(response.body.success).toEqual(true);
      });
    });

    describe('GET /troubleshooter/:id', () => {
      it('should get the correct session', async () => {
        const plugin = {
          domain: 'getone.xyz',
        };

        const {
          body: {
            data: { _id: pluginId },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin)
          .expect(201);

        const {
          body: { data: pluginToken },
        } = await request(app).get(`/v1/plugins/${pluginId}/token`).expect(200);
        expect(pluginToken).toBeDefined();

        const response = await request(app)
          .post('/v1/troubleshooter')
          .set('authorization', `Bearer ${pluginToken}`)
          .set('x-client-id', 'test')
          .send({})
          .expect(201);

        expect(response.body.success).toEqual(true);
        console.log(response.body.data._id);

        await request(app)
          .get(`/v1/troubleshooter/${response.body.data._id}`)
          .set('authorization', `Bearer ${token}`)
          .expect(200);
      });
    });

    describe('GET /troubleshooter', () => {
      it('should get all sessions', async () => {
        const plugin = {
          domain: 'getall.xyz',
        };

        const {
          body: {
            data: { _id: pluginId },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin)
          .expect(201);

        const {
          body: { data: pluginToken },
        } = await request(app).get(`/v1/plugins/${pluginId}/token`).expect(200);
        expect(pluginToken).toBeDefined();

        for (let i = 0; i < 10; i++) {
          const response = await request(app)
            .post('/v1/troubleshooter')
            .set('authorization', `Bearer ${pluginToken}`)
            .set('x-client-id', 'test')
            .send({})
            .expect(201);
          expect(response.body.success).toEqual(true);
        }

        const responseAll = await request(app)
          .get(`/v1/troubleshooter`)
          .set('authorization', `Bearer ${token}`)
          .expect(200);
        expect(responseAll.body.success).toEqual(true);
        expect(responseAll.body.data.length).toBeGreaterThanOrEqual(10);
      });
    });
  });
});
