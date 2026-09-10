process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '4000';
process.env.DATABASE_HOST ??= '127.0.0.1';
process.env.DATABASE_PORT ??= '3306';
process.env.DATABASE_USER ??= 'root';
process.env.DATABASE_PASSWORD ??= 'unit-test-only';
process.env.DATABASE_NAME ??= 'sinfinity_test';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-please-change-32ch';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-please-change-32';
process.env.JWT_ACCESS_TTL ??= '15m';
process.env.JWT_REFRESH_TTL ??= '7d';
process.env.JWT_PASSWORD_RESET_TTL ??= '1h';
process.env.CORS_ORIGINS ??=
  'http://localhost:3000,http://localhost:3001,http://localhost:3002';
process.env.STORAGE_DRIVER ??= 'local';
process.env.STORAGE_LOCAL_ROOT ??= './storage/uploads-test';
