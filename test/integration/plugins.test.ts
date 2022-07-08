import request from 'supertest';
import axios from 'axios';

import { registerValidUser } from '../helpers';
import { clearDB, disconnectMongo, initMongo } from '../setup';
import app from '../../src/app';

jest.mock('axios');

describe('Plugins', () => {
  beforeAll(async () => await initMongo());
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

    describe('POST /plugins/:id/token', () => {
      it('should return 400', async () => {
        await request(app).post('/v1/plugins/123/token').expect(400);
      });

      it('should return 404 not found', async () => {
        await request(app)
          .post('/v1/plugins/0123456789abcdef12345678/token')
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
        } = await request(app).post(`/v1/plugins/${_id}/token`).expect(200);
        expect(pluginToken).toBeDefined();
      });
    });
  });

  describe('/plugins/:id/ice-servers', () => {
    let token = '';
    beforeAll(async () => {
      await clearDB();
      token = await registerValidUser({ jwtExpiration: '1d' });
    });

    describe('PUT /plugins/:id/ice-servers', () => {
      it('should return 200 and add static configs', async () => {
        const plugin = {
          domain: 'static.xyz',
        };

        const {
          body: {
            data: { domain, _id },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin)
          .expect(201);
        expect(domain).toBe(plugin.domain);

        const iceServers = {
          mode: 'static',
          iceServers: [
            {
              urls: ['stun:0.not.a.real.url'],
            },
            {
              username: 'username',
              credential: 'credential',
              urls: ['turn:1.not.a.real.url', 'turns:2.not.a.real.url'],
            },
          ],
        };

        const {
          body: { data: iceServers1 },
        } = await request(app)
          .put(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${token}`)
          .send(iceServers)
          .expect(200);
        expect(iceServers1.mode).toBe(iceServers.mode);
        expect(iceServers1.iceServers).toEqual(iceServers.iceServers);
      });

      it('should return 200 and add shared secret configs', async () => {
        const plugin = {
          domain: 'shared-secret.xyz',
        };

        const {
          body: {
            data: { domain, _id },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin)
          .expect(201);
        expect(domain).toBe(plugin.domain);

        const iceServers = {
          mode: 'shared-secret',
          secret: 'not.so.secret',
        };

        const {
          body: { data: iceServers1 },
        } = await request(app)
          .put(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${token}`)
          .send(iceServers)
          .expect(200);
        expect(iceServers1.mode).toBe(iceServers.mode);
        expect(iceServers1.secret).toBe(iceServers.secret);
      });

      it('should return 200 and add url-based configs', async () => {
        const plugin = {
          domain: 'url.xyz',
        };

        const {
          body: {
            data: { domain, _id },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin)
          .expect(201);
        expect(domain).toBe(plugin.domain);

        const iceServers = {
          mode: 'url',
          url: 'not.so.url',
        };

        const {
          body: { data: iceServers1 },
        } = await request(app)
          .put(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${token}`)
          .send(iceServers)
          .expect(200);
        expect(iceServers1.mode).toBe(iceServers.mode);
        expect(iceServers1.url).toBe(iceServers.url);
      });
    });

    describe('GET /plugins/:id/ice-servers', () => {
      it('should return 200 and raw static config for owner', async () => {
        const plugin = {
          domain: 'owner.static.io',
        };

        const {
          body: {
            data: { _id },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin);

        const iceServers = {
          mode: 'static',
          iceServers: [
            {
              urls: ['stun:0.not.a.real.url'],
            },
            {
              username: 'username',
              credential: 'credential',
              urls: ['turn:1.not.a.real.url', 'turns:2.not.a.real.url'],
            },
          ],
        };

        await request(app)
          .put(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${token}`)
          .send(iceServers);

        const {
          body: { data: iceServers2 },
        } = await request(app)
          .get(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${token}`)
          .expect(200);
        expect(iceServers2.mode).toBe(iceServers.mode);
        expect(iceServers2.iceServers).toEqual(iceServers.iceServers);
      });

      it('should return 200 and raw shared-secret config for owner', async () => {
        const plugin = {
          domain: 'owner.shared-secret.io',
        };

        const {
          body: {
            data: { _id },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin);

        const iceServers = {
          mode: 'shared-secret',
          secret: 'not.so.secret',
          uri: 'not.so.uri',
        };

        const {
          body: {},
        } = await request(app)
          .put(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${token}`)
          .send(iceServers);

        const {
          body: { data: iceServers2 },
        } = await request(app)
          .get(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${token}`)
          .expect(200);
        expect(iceServers2.mode).toBe(iceServers.mode);
        expect(iceServers2.secret).toBe(iceServers.secret);
        expect(iceServers2.uri).toBe(iceServers.uri);
      });

      it('should return 200 and raw url-based config for owner', async () => {
        const plugin = {
          domain: 'owner.url.io',
        };

        const {
          body: {
            data: { _id },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin);

        const iceServers = {
          mode: 'url',
          url: 'not.so.url',
        };

        await request(app)
          .put(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${token}`)
          .send(iceServers);

        const {
          body: { data: iceServers2 },
        } = await request(app)
          .get(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${token}`)
          .expect(200);
        expect(iceServers2.mode).toBe(iceServers.mode);
        expect(iceServers2.url).toBe(iceServers.url);
      });

      it('should return 200 and raw config for default plugin for owner', async () => {
        const newUserToken = await registerValidUser({
          jwtExpiration: '1d',
          email: 'owner.default@localhost',
        });

        const plugin0 = {
          domain: '0.owner.default.io',
        };
        const {
          body: {
            data: { _id: id0 },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${newUserToken}`)
          .send(plugin0);
        const iceServers0 = {
          mode: 'static',
          iceServers: [
            {
              urls: ['stun:0.not.a.real.url'],
            },
          ],
        };
        await request(app)
          .put(`/v1/plugins/${id0}/ice-servers`)
          .set('authorization', `Bearer ${newUserToken}`)
          .send(iceServers0);

        const plugin1 = {
          domain: '1.owner.default.io',
        };
        const {
          body: {
            data: { _id: id1 },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${newUserToken}`)
          .send(plugin1);
        const iceServers1 = {
          mode: 'static',
          iceServers: [
            {
              urls: ['stun:1.not.a.real.url'],
            },
          ],
        };
        await request(app)
          .put(`/v1/plugins/${id1}/ice-servers`)
          .set('authorization', `Bearer ${newUserToken}`)
          .send(iceServers1);

        const {
          body: { data: iceServersResponseX },
        } = await request(app)
          .get(`/v1/plugins/ice-servers`)
          .set('authorization', `Bearer ${newUserToken}`)
          .expect(200);
        expect(iceServersResponseX.mode).toBe(iceServers0.mode);
        expect(iceServersResponseX.iceServers).toEqual(iceServers0.iceServers);
      });

      it('should return 200 and processed iceServers from static config for user', async () => {
        const plugin = {
          domain: 'static.io',
        };

        const {
          body: {
            data: { _id },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin);

        const iceServers = {
          mode: 'static',
          iceServers: [
            {
              urls: ['stun:0.not.a.real.url'],
            },
            {
              username: 'username',
              credential: 'credential',
              urls: ['turn:1.not.a.real.url', 'turns:2.not.a.real.url'],
            },
          ],
        };

        await request(app)
          .put(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${token}`)
          .send(iceServers);

        const {
          body: { data: pluginToken },
        } = await request(app).post(`/v1/plugins/${_id}/token`).expect(200);
        expect(pluginToken).toBeDefined();

        const {
          body: { data: iceServers2 },
        } = await request(app)
          .get(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${pluginToken}`)
          .expect(200);
        expect(iceServers2.iceServers).toEqual(iceServers.iceServers);
      });

      it('should return 200 and processed iceServers from shared-secret config for user', async () => {
        const spy = jest
          .spyOn(Date, 'now')
          .mockImplementation(() => 1654254083000); // Friday, June 3, 2022 11:01:23 AM UTC

        const plugin = {
          domain: 'shared-secret.io',
        };

        const {
          body: {
            data: { _id },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin);

        const iceServers = {
          mode: 'shared-secret',
          secret: 'not.so.secret',
          uri: 'not.so.uri',
        };

        const {
          body: {},
        } = await request(app)
          .put(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${token}`)
          .send(iceServers);

        // Output of the below linux command:
        // secret=not.so.secret && \
        // time=1654254083 && \
        // expiry=8400 && \
        // username=$(( $time + $expiry )) &&\
        // echo username: $username && \
        // echo password: $(echo -n $username | openssl dgst -binary -sha1 -hmac $secret | openssl base64)
        const username = '1654262483';
        const password = 'YTddDier2bjLrmQKVZWdWgNf46A=';

        const {
          body: { data: pluginToken },
        } = await request(app).post(`/v1/plugins/${_id}/token`).expect(200);
        expect(pluginToken).toBeDefined();

        const {
          body: { data: iceServers2 },
        } = await request(app)
          .get(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${pluginToken}`)
          .expect(200);

        expect(iceServers2.iceServers).toEqual([
          {
            username,
            credential: password,
            urls: ['not.so.uri'],
          },
        ]);

        spy.mockRestore();
      });

      it('should return 200 and processed iceServers from url-based config for user', async () => {
        const plugin = {
          domain: 'url.io',
        };

        const {
          body: {
            data: { _id },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${token}`)
          .send(plugin);

        const iceServers = {
          mode: 'url',
          url: 'not.so.url',
        };

        await request(app)
          .put(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${token}`)
          .send(iceServers);

        const mockResult = {
          iceServers: [
            {
              urls: ['stun:0.not.a.real.url'],
            },
            {
              username: 'username',
              credential: 'credential',
              urls: ['turn:1.not.a.real.url', 'turns:2.not.a.real.url'],
            },
          ],
        };
        (axios.request as any).mockResolvedValueOnce({
          data: mockResult,
        });

        const {
          body: { data: pluginToken },
        } = await request(app).post(`/v1/plugins/${_id}/token`).expect(200);
        expect(pluginToken).toBeDefined();

        const {
          body: { data: iceServers2 },
        } = await request(app)
          .get(`/v1/plugins/${_id}/ice-servers`)
          .set('authorization', `Bearer ${pluginToken}`)
          .expect(200);
        expect(iceServers2.iceServers).toEqual(mockResult);
      });

      it('should return 200 and processed config for derived plugin for user', async () => {
        const newUserToken = await registerValidUser({
          jwtExpiration: '1d',
          email: 'default@localhost',
        });

        const plugin0 = {
          domain: '0.owner.default.io',
        };
        const {
          body: {
            data: { _id: id0 },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${newUserToken}`)
          .send(plugin0);
        const iceServers0 = {
          mode: 'static',
          iceServers: [
            {
              urls: ['stun:0.not.a.real.url'],
            },
          ],
        };
        await request(app)
          .put(`/v1/plugins/${id0}/ice-servers`)
          .set('authorization', `Bearer ${newUserToken}`)
          .send(iceServers0);

        const plugin1 = {
          domain: '1.owner.default.io',
        };
        const {
          body: {
            data: { _id: id1 },
          },
        } = await request(app)
          .post('/v1/plugins')
          .set('authorization', `Bearer ${newUserToken}`)
          .send(plugin1);
        const iceServers1 = {
          mode: 'static',
          iceServers: [
            {
              urls: ['stun:1.not.a.real.url'],
            },
          ],
        };
        await request(app)
          .put(`/v1/plugins/${id1}/ice-servers`)
          .set('authorization', `Bearer ${newUserToken}`)
          .send(iceServers1);

        const {
          body: { data: pluginToken0 },
        } = await request(app).post(`/v1/plugins/${id0}/token`).expect(200);
        expect(pluginToken0).toBeDefined();
        const {
          body: { data: iceServersX },
        } = await request(app)
          .get(`/v1/plugins/ice-servers`)
          .set('authorization', `Bearer ${pluginToken0}`)
          .expect(200);
        expect(iceServersX.iceServers).toEqual(iceServers0.iceServers);

        const {
          body: { data: pluginToken1 },
        } = await request(app).post(`/v1/plugins/${id1}/token`).expect(200);
        expect(pluginToken1).toBeDefined();
        const {
          body: { data: iceServersY },
        } = await request(app)
          .get(`/v1/plugins/ice-servers`)
          .set('authorization', `Bearer ${pluginToken1}`)
          .expect(200);
        expect(iceServersY.iceServers).toEqual(iceServers1.iceServers);
      });
    });
  });
});
