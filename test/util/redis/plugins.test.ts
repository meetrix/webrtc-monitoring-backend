import { APP_REDIS_PLUGINS_CLIENT_IDS_ACTIVE } from '../../../src/config/settings';
import { getActivePluginClientskey } from '../../../src/util/redis/plugins';

describe('utils/redis/plugins', () => {
  it('should generate the key only with the domain name', () => {
    expect(
      getActivePluginClientskey({
        domain: 'meetrix.io',
      })
    ).toBe(`${APP_REDIS_PLUGINS_CLIENT_IDS_ACTIVE}:meetrix.io`);
  });
});
