import { initMongo, disconnectMongo, clearDB } from '../setup';

describe('Plugin', () => {
  beforeAll(async () => await initMongo());
  afterAll(async () => await disconnectMongo());

  it('should create a plugin', () => {});
});
