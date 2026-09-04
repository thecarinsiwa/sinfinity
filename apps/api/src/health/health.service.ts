import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Pool } from 'mysql2/promise';
import { MYSQL_POOL } from '../database/database.constants';
import { HealthResponseDto } from './health-response.dto';
import { readPackageVersion } from './package-version';

@Injectable()
export class HealthService {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  async check(): Promise<HealthResponseDto> {
    try {
      await this.pool.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }

    return {
      status: 'up',
      database: 'up',
      version: readPackageVersion(),
    };
  }
}
