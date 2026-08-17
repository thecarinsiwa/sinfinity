import {
  Global,
  Inject,
  Injectable,
  Module,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { createPool, type Pool } from 'mysql2/promise';
import { Env } from '../config/env.validation';
import { DRIZZLE, MYSQL_POOL } from './database.constants';
import { DrizzleDB } from './database.types';
import * as schema from './schema';

const POOL_CONNECTION_LIMIT = 10;

@Injectable()
class MysqlPoolCloser implements OnModuleDestroy {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: MYSQL_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Pool =>
        createPool({
          uri: config.get('DATABASE_URL', { infer: true }),
          waitForConnections: true,
          connectionLimit: POOL_CONNECTION_LIMIT,
          enableKeepAlive: true,
        }),
    },
    {
      provide: DRIZZLE,
      inject: [MYSQL_POOL],
      useFactory: (pool: Pool): DrizzleDB =>
        drizzle(pool, { schema, mode: 'default' }),
    },
    MysqlPoolCloser,
  ],
  exports: [MYSQL_POOL, DRIZZLE],
})
export class DatabaseModule {}
