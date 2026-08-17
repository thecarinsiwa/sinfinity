import { DEFAULT_CORS_ORIGINS, DEFAULT_PORT } from './constants';
import { validateEnv } from './env.validation';

const validEnv = {
  NODE_ENV: 'development',
  PORT: '4000',
  DATABASE_URL: 'mysql://root:password@127.0.0.1:3306/sinfinity',
  JWT_ACCESS_SECRET: 'test-access-secret-please-change-32ch',
  JWT_REFRESH_SECRET: 'test-refresh-secret-please-change-32',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',
  CORS_ORIGINS:
    'http://localhost:3000,http://localhost:3001,http://localhost:3002',
};

describe('validateEnv', () => {
  it('parses a valid environment', () => {
    const env = validateEnv(validEnv);

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(4000);
    expect(env.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(env.JWT_ACCESS_TTL).toBe('15m');
    expect(env.JWT_REFRESH_TTL).toBe('7d');
    expect(env.CORS_ORIGINS).toEqual([...DEFAULT_CORS_ORIGINS]);
  });

  it('applies defaults for optional variables', () => {
    const env = validateEnv({
      DATABASE_URL: validEnv.DATABASE_URL,
      JWT_ACCESS_SECRET: validEnv.JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET: validEnv.JWT_REFRESH_SECRET,
    });

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(DEFAULT_PORT);
    expect(env.JWT_ACCESS_TTL).toBe('15m');
    expect(env.JWT_REFRESH_TTL).toBe('7d');
    expect(env.CORS_ORIGINS).toEqual([...DEFAULT_CORS_ORIGINS]);
  });

  it('throws when DATABASE_URL is missing', () => {
    expect(() =>
      validateEnv({
        JWT_ACCESS_SECRET: validEnv.JWT_ACCESS_SECRET,
        JWT_REFRESH_SECRET: validEnv.JWT_REFRESH_SECRET,
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it('throws when a JWT secret is too short', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        JWT_ACCESS_SECRET: 'too-short',
      }),
    ).toThrow(/JWT_ACCESS_SECRET/);
  });
});
