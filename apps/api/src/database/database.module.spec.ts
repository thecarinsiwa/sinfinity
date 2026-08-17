import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'mysql2/promise';
import { validateEnv } from '../config/env.validation';
import { DRIZZLE, MYSQL_POOL } from './database.constants';
import { DatabaseModule } from './database.module';
import { DrizzleDB } from './database.types';

describe('DatabaseModule', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    process.env.NODE_ENV ??= 'test';
    process.env.DATABASE_URL ??=
      'mysql://root:password@127.0.0.1:3306/sinfinity_test';
    process.env.JWT_ACCESS_SECRET ??=
      'test-access-secret-please-change-32ch';
    process.env.JWT_REFRESH_SECRET ??=
      'test-refresh-secret-please-change-32';

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          validate: validateEnv,
        }),
        DatabaseModule,
      ],
    }).compile();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('provides a mysql2 pool from DATABASE_URL', () => {
    const pool = moduleRef.get<Pool>(MYSQL_POOL);
    const config = moduleRef.get(ConfigService);

    expect(pool).toBeDefined();
    expect(config.get('DATABASE_URL')).toBe(process.env.DATABASE_URL);
  });

  it('provides a Drizzle client bound to the pool', () => {
    const db = moduleRef.get<DrizzleDB>(DRIZZLE);

    expect(db).toBeDefined();
    expect(typeof db.select).toBe('function');
  });
});
