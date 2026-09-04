import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/config/configure-app';
import { Env } from './../src/config/env.validation';
import { setupSwagger } from './../src/config/setup-swagger';
import { MYSQL_POOL } from './../src/database/database.constants';
import { readPackageVersion } from './../src/health/package-version';
import { JwtAuthGuard } from './../src/modules/auth/jwt-auth.guard';
import { TestJwtAuthGuard } from './test-jwt-auth.guard';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const poolQuery = jest.fn().mockResolvedValue([[{ 1: 1 }]]);

  beforeEach(async () => {
    poolQuery.mockReset();
    poolQuery.mockResolvedValue([[{ 1: 1 }]]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MYSQL_POOL)
      .useValue({
        query: poolQuery,
        end: jest.fn().mockResolvedValue(undefined),
      })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    const config = app.get(ConfigService<Env, true>);
    configureApp(app, config);
    setupSwagger(app, config.get('PORT', { infer: true }));
    await app.init();
  });

  it('/api/v1/ping (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/ping')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/api/v1/health (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(res.body).toEqual({
      status: 'up',
      database: 'up',
      version: readPackageVersion(),
    });
    expect(poolQuery).toHaveBeenCalledWith('SELECT 1');
  });

  it('/api/v1/health (GET) returns 503 when MySQL is down', async () => {
    poolQuery.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(503)
      .expect({
        statusCode: 503,
        message: 'Database unavailable',
        error: 'Service Unavailable',
      });
  });

  it('/docs (GET) is outside the /api/v1 prefix', async () => {
    const res = await request(app.getHttpServer()).get('/docs').expect(200);
    const contentType = String(res.headers['content-type']);

    expect(contentType).toMatch(/html/);
  });

  it('/api/docs (GET) serves the Swagger UI', async () => {
    const res = await request(app.getHttpServer()).get('/api/docs').expect(200);
    const contentType = String(res.headers['content-type']);

    expect(contentType).toMatch(/html/);
  });

  it('/api/docs/ (GET) serves the Swagger UI with a trailing slash', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs/')
      .expect(200);
    const contentType = String(res.headers['content-type']);

    expect(contentType).toMatch(/html/);
  });

  it('/api/v1/docs is not the Swagger UI', () => {
    return request(app.getHttpServer()).get('/api/v1/docs').expect(404);
  });

  it('/api/v1/docs-json is not the OpenAPI spec', () => {
    return request(app.getHttpServer()).get('/api/v1/docs-json').expect(404);
  });

  it('/docs-json (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);

    const body = res.body as {
      info: { title: string; version: string };
      tags?: { name: string }[];
      paths: Record<string, unknown>;
      components: {
        securitySchemes: Record<string, { type: string; scheme: string }>;
      };
    };

    expect(body.info.title).toBe('Sinfinity API');
    expect(body.info.version).toBe('1.0');
    expect(body.paths['/api/v1/ping']).toBeDefined();
    expect(body.paths['/api/v1/health']).toBeDefined();
    expect(body.paths['/api/v1/countries']).toBeDefined();
    expect(body.paths['/api/v1/cities']).toBeDefined();
    expect(body.paths['/api/v1/currencies']).toBeDefined();
    expect(body.paths['/api/v1/exchange-rates']).toBeDefined();
    expect(body.paths['/api/v1/exchange-rates/latest']).toBeDefined();
    expect(body.paths['/api/v1/taxes']).toBeDefined();
    expect(body.paths['/api/v1/units']).toBeDefined();
    expect(body.paths['/api/v1/payment-terms']).toBeDefined();
    expect(body.paths['/api/v1/shipping-terms']).toBeDefined();
    expect(body.paths['/api/v1/organizations']).toBeDefined();
    expect(body.paths['/api/v1/branches']).toBeDefined();
    expect(body.paths['/api/v1/users']).toBeDefined();
    expect(body.paths['/api/v1/auth/login']).toBeDefined();
    expect(body.paths['/api/v1/auth/refresh']).toBeDefined();
    expect(body.paths['/api/v1/auth/set-password']).toBeDefined();
    expect(body.paths['/api/v1/auth/logout']).toBeDefined();
    expect(body.paths['/api/v1/auth/me']).toBeDefined();
    expect(body.tags?.some((tag) => tag.name === 'Health')).toBe(true);
    expect(body.tags?.some((tag) => tag.name === 'Settings')).toBe(true);
    expect(body.tags?.some((tag) => tag.name === 'Organisation')).toBe(true);
    expect(body.tags?.some((tag) => tag.name === 'Auth')).toBe(true);
    expect(body.components.securitySchemes['access-token']).toEqual(
      expect.objectContaining({
        type: 'http',
        scheme: 'bearer',
      }),
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
