import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Pool } from 'mysql2/promise';
import { MYSQL_POOL } from '../database/database.constants';
import { HealthService } from './health.service';
import * as packageVersion from './package-version';

describe('HealthService', () => {
  let service: HealthService;
  let query: jest.Mock;

  beforeEach(async () => {
    query = jest.fn().mockResolvedValue([[{ 1: 1 }]]);
    jest.spyOn(packageVersion, 'readPackageVersion').mockReturnValue('0.0.1');

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: MYSQL_POOL,
          useValue: { query } satisfies Pick<Pool, 'query'>,
        },
      ],
    }).compile();

    service = moduleRef.get(HealthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns up when MySQL responds', async () => {
    await expect(service.check()).resolves.toEqual({
      status: 'up',
      database: 'up',
      version: '0.0.1',
    });
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('throws 503 when MySQL ping fails', async () => {
    query.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
