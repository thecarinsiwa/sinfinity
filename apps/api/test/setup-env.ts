process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '4000';
process.env.DATABASE_URL ??=
  'mysql://root:password@127.0.0.1:3306/sinfinity_test';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-please-change-32ch';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-please-change-32';
process.env.JWT_ACCESS_TTL ??= '15m';
process.env.JWT_REFRESH_TTL ??= '7d';
process.env.CORS_ORIGINS ??=
  'http://localhost:3000,http://localhost:3001,http://localhost:3002';
