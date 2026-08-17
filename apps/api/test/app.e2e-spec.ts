import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/config/configure-app';
import { Env } from './../src/config/env.validation';
import { setupSwagger } from './../src/config/setup-swagger';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const config = app.get(ConfigService<Env, true>);
    configureApp(app, config);
    setupSwagger(app, config.get('PORT', { infer: true }));
    await app.init();
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });

  it('/docs (GET) is outside the /api/v1 prefix', async () => {
    const res = await request(app.getHttpServer()).get('/docs').expect(200);
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
      components: {
        securitySchemes: Record<string, { type: string; scheme: string }>;
      };
    };

    expect(body.info.title).toBe('Sinfinity API');
    expect(body.info.version).toBe('1.0');
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
