import { UNIT_TEST_PASSWORD } from '../test-fixtures/passwords';
import { DEFAULT_CORS_ORIGINS, DEFAULT_PORT } from './constants';
import {
  composeDatabaseUrl,
  parseDatabaseUrl,
  resolveDatabaseConnection,
} from './database-connection';
import { validateEnv } from './env.validation';

/** Special chars only for URL-encoding coverage (not a real credential). */
const UNIT_TEST_PASSWORD_ENCODED = 'unit-test@x#1';

describe('database-connection', () => {
  it('composes URL without password segment when empty', () => {
    expect(
      composeDatabaseUrl({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '',
        database: 'sinfinity',
      }),
    ).toBe('mysql://root@127.0.0.1:3306/sinfinity');
  });

  it('encodes special characters in password', () => {
    expect(
      composeDatabaseUrl({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: UNIT_TEST_PASSWORD_ENCODED,
        database: 'sinfinity',
      }),
    ).toBe('mysql://root:unit-test%40x%231@127.0.0.1:3306/sinfinity');
  });

  it('parses DATABASE_URL into parts', () => {
    expect(
      parseDatabaseUrl(
        `mysql://root:${UNIT_TEST_PASSWORD}@127.0.0.1:3307/sinfinity`,
      ),
    ).toEqual({
      host: '127.0.0.1',
      port: 3307,
      user: 'root',
      password: UNIT_TEST_PASSWORD,
      database: 'sinfinity',
    });
  });

  it('prefers discrete DATABASE_* over DATABASE_URL', () => {
    expect(
      resolveDatabaseConnection({
        DATABASE_HOST: '127.0.0.1',
        DATABASE_PORT: '3306',
        DATABASE_USER: 'root',
        DATABASE_PASSWORD: '',
        DATABASE_NAME: 'sinfinity',
        DATABASE_URL: `mysql://other:${UNIT_TEST_PASSWORD}@10.0.0.1:3306/other`,
      }),
    ).toEqual({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'sinfinity',
    });
  });
});

describe('validateEnv', () => {
  const validDiscrete = {
    NODE_ENV: 'development',
    PORT: '4000',
    DATABASE_HOST: '127.0.0.1',
    DATABASE_PORT: '3306',
    DATABASE_USER: 'root',
    DATABASE_PASSWORD: '',
    DATABASE_NAME: 'sinfinity',
    JWT_ACCESS_SECRET: 'test-access-secret-please-change-32ch',
    JWT_REFRESH_SECRET: 'test-refresh-secret-please-change-32',
    JWT_ACCESS_TTL: '15m',
    JWT_REFRESH_TTL: '7d',
    CORS_ORIGINS:
      'http://localhost:3000,http://localhost:3001,http://localhost:3002',
  };

  it('parses discrete DATABASE_* and derives DATABASE_URL', () => {
    const env = validateEnv(validDiscrete);

    expect(env.PORT).toBe(4000);
    expect(env.DATABASE_HOST).toBe('127.0.0.1');
    expect(env.DATABASE_PASSWORD).toBe('');
    expect(env.DATABASE_NAME).toBe('sinfinity');
    expect(env.DATABASE_URL).toBe('mysql://root@127.0.0.1:3306/sinfinity');
    expect(env.CORS_ORIGINS).toEqual([...DEFAULT_CORS_ORIGINS]);
  });

  it('accepts legacy DATABASE_URL only', () => {
    const env = validateEnv({
      DATABASE_URL: `mysql://root:${UNIT_TEST_PASSWORD}@127.0.0.1:3306/sinfinity`,
      JWT_ACCESS_SECRET: validDiscrete.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: validDiscrete.JWT_REFRESH_SECRET,
    });

    expect(env.PORT).toBe(DEFAULT_PORT);
    expect(env.DATABASE_USER).toBe('root');
    expect(env.DATABASE_PASSWORD).toBe(UNIT_TEST_PASSWORD);
    expect(env.DATABASE_NAME).toBe('sinfinity');
  });

  it('maps API_PORT / CORS_ORIGIN / JWT_*_EXPIRES_IN aliases', () => {
    const env = validateEnv({
      NODE_ENV: 'development',
      API_PORT: '3000',
      DATABASE_HOST: '127.0.0.1',
      DATABASE_USER: 'root',
      DATABASE_PASSWORD: '',
      DATABASE_NAME: 'sinfinity',
      JWT_ACCESS_SECRET: validDiscrete.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: validDiscrete.JWT_REFRESH_SECRET,
      CORS_ORIGIN: 'http://localhost:3001',
      JWT_ACCESS_EXPIRES_IN: '20m',
      JWT_REFRESH_EXPIRES_IN: '14d',
    });

    expect(env.PORT).toBe(3000);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3001']);
    expect(env.JWT_ACCESS_TTL).toBe('20m');
    expect(env.JWT_REFRESH_TTL).toBe('14d');
  });

  it('throws when database config is missing', () => {
    expect(() =>
      validateEnv({
        JWT_ACCESS_SECRET: validDiscrete.JWT_ACCESS_SECRET,
        JWT_REFRESH_SECRET: validDiscrete.JWT_REFRESH_SECRET,
      }),
    ).toThrow(/Database config required/);
  });

  it('throws when a JWT secret is too short', () => {
    expect(() =>
      validateEnv({
        ...validDiscrete,
        JWT_ACCESS_SECRET: 'too-short',
      }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });
});
