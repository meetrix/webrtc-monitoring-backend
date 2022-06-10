import request from 'supertest';

import { registerValidUser } from '../helpers';
import { clearDB, disconnectMongo, initMongo } from '../setup';
import app from '../../src/app';

describe('Plugins', () => {
  beforeAll(async () => await initMongo());
  // beforeEach(async () => await clearDB());
  afterAll(async () => await disconnectMongo());

  describe('/plugins', () => {
    beforeAll(async () => {
      await clearDB();
    });

    describe('POST /plugins', () => {
      let token = '';
      beforeAll(async () => {
        token = await registerValidUser({ jwtExpiration: '1d' });
      });

      it('should return 200 and create a plugin', async () => {
        const plugin = {
          domain: 'anything',
        };

        const { body } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin)
          .expect(200);
        expect(body.data.domain).toBe(plugin.domain);
      });
    });

    // describe('GET /plugins', () => {});

    // describe('GET /plugins/:id', () => {});

    // describe('PATCH /plugins/:id', () => {});

    // describe('DELETE /plugins/:id', () => {});

    // describe('GET /plugins/:id/ice-servers', () => {});

    // describe('PUT /plugins/:id/ice-servers', () => {});

    // describe('GET /plugins/ice-servers', () => {});

    // describe('PUT /plugins/ice-servers', () => {});
  });
});
