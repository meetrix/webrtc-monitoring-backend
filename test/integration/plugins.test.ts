import request from 'supertest';

import { registerValidUser } from '../helpers';
import { clearDB, disconnectMongo, initMongo } from '../setup';
import app from '../../src/app';

describe('Plugins', () => {
  beforeAll(async () => await initMongo());
  // beforeEach(async () => await clearDB());
  afterAll(async () => await disconnectMongo());

  describe('/plugins', () => {
    let token = '';
    beforeAll(async () => {
      await clearDB();
      token = await registerValidUser({ jwtExpiration: '1d' });
    });

    describe('POST /plugins', () => {
      it('should return 401 unauthorized', async () => {
        const plugin = {
          domain: 'anything1.xyz',
        };

        await request(app)
          .post('/v1/plugins')
          // No auth
          .send(plugin)
          .expect(401);
      });

      it('should return 201 and create a plugin', async () => {
        const plugin = {
          domain: 'create.xyz',
        };

        const { body } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin)
          .expect(201);
        expect(body.data.domain).toBe(plugin.domain);
      });
    });

    describe('GET /plugins', () => {
      it('should return 401 unauthorized', async () => {
        await request(app)
          .get('/v1/plugins')
          // No auth
          .expect(401);
      });

      it('should return 200 and an array', async () => {
        const { body } = await request(app)
          .get('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .expect(200);
        expect(body.data).toHaveProperty('length');
      });

      it('should return 200 and have existing plugins in array', async () => {
        const plugin = {
          domain: 'get-all.xyz',
        };

        const {
          body: { data: plugin1 },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin)
          .expect(201);
        expect(plugin1.domain).toBe(plugin.domain);

        const {
          body: { data: plugins },
        } = await request(app)
          .get('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .expect(200);
        expect(plugins[plugins.length - 1].domain).toBe(plugin.domain);
      });
    });

    describe('GET /plugins/:id', () => {
      it('should return 401 unauthorized', async () => {
        await request(app)
          .get('/v1/plugins/123')
          // No auth
          .expect(401);
      });

      it('should return 200 and a plugin', async () => {
        const plugin = {
          domain: 'get.xyz',
        };

        const {
          body: { data: plugin1 },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin)
          .expect(201);
        expect(plugin1.domain).toBe(plugin.domain);

        const {
          body: { data: plugin2 },
        } = await request(app)
          .get(`/v1/plugins/${plugin1._id}`)
          .set('authorization', `Bearer ${token}`)
          .expect(200);
        expect(plugin2.domain).toBe(plugin.domain);
      });
    });

    describe('PATCH /plugins/:id', () => {
      it('should return 401 unauthorized', async () => {
        await request(app)
          .patch('/v1/plugins/123')
          // No auth
          .expect(401);
      });

      it('should return 200 and regenerate a token', async () => {
        const plugin = {
          domain: 'patch.xyz',
        };

        const {
          body: { data: plugin1 },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin)
          .expect(201);
        expect(plugin1.domain).toBe(plugin.domain);

        const {
          body: { data: plugin2 },
        } = await request(app)
          .patch(`/v1/plugins/${plugin1._id}`)
          .set('authorization', `Bearer ${token}`)
          .send({})
          .expect(200);
        expect(plugin2._id).not.toBe(plugin1._id);
        expect(plugin2.synonyms).toContain(plugin1._id);
      });
    });

    describe('DELETE /plugins/:id', () => {
      it('should return 401 unauthorized', async () => {
        await request(app)
          .delete('/v1/plugins/123')
          // No auth
          .expect(401);
      });

      it('should return 200 and delete a plugin', async () => {
        const plugin = {
          domain: 'delete.xyz',
        };

        const {
          body: { data: plugin1 },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin)
          .expect(201);
        expect(plugin1.domain).toBe(plugin.domain);

        const {
          body: { data: plugin2 },
        } = await request(app)
          .delete(`/v1/plugins/${plugin1._id}`)
          .set('authorization', `Bearer ${token}`)
          .expect(200);
        expect(plugin2._id).toBe(plugin1._id);

        const {
          body: { data: plugin3 },
        } = await request(app)
          .get(`/v1/plugins/${plugin1._id}`)
          .set('authorization', `Bearer ${token}`)
          .expect(404);
        expect(plugin3).toBe(undefined);

        const {
          body: { data: plugin4 },
        } = await request(app)
          .get(`/v1/plugins/${plugin1._id}?revoked=true`)
          .set('authorization', `Bearer ${token}`)
          .expect(200);
        expect(plugin4._id).toBe(plugin1._id);
      });
    });
  });

  describe('/plugins/:id/token', () => {
    let token = '';
    beforeAll(async () => {
      await clearDB();
      token = await registerValidUser({ jwtExpiration: '1d' });
    });

    describe('GET /plugins/:id/token', () => {
      it('should return 400', async () => {
        await request(app).get('/v1/plugins/123/token').expect(400);
      });

      it('should return 404 not found', async () => {
        await request(app)
          .get('/v1/plugins/0123456789abcdef12345678/token')
          .expect(404);
      });

      it('should return 200 and return a token', async () => {
        const plugin = {
          domain: 'anything.xyz',
        };

        const {
          body: {
            data: { _id },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin)
          .expect(201);

        const {
          body: { data: pluginToken },
        } = await request(app).get(`/v1/plugins/${_id}/token`).expect(200);
        expect(pluginToken).toBeDefined();
        console.log(pluginToken);
      });
    });
  });
});
