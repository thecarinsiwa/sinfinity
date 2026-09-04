import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/config/configure-app';
import { SWAGGER_BEARER_AUTH } from '../src/config/constants';
import { Env } from '../src/config/env.validation';
import { setupSwagger } from '../src/config/setup-swagger';
import { SWAGGER_TAG, SWAGGER_TAG_DEFINITIONS } from '../src/config/swagger-tags';
import { MYSQL_POOL } from '../src/database/database.constants';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import {
  expectTagDefined,
  expectTaggedOperation,
  type OpenApiDocument,
} from './openapi-helpers';
import { TestJwtAuthGuard } from './test-jwt-auth.guard';

describe('Phase 8 OpenAPI — Commandes clients (e2e)', () => {
  let app: INestApplication<App>;
  let document: OpenApiDocument;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MYSQL_POOL)
      .useValue({
        query: jest.fn().mockResolvedValue([[{ 1: 1 }]]),
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

    const res = await request(app.getHttpServer()).get('/docs-json').expect(200);
    document = res.body as OpenApiDocument;
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers Commandes clients tag with description among Phase 0–8 tags', () => {
    expectTagDefined(document, SWAGGER_TAG.CommandesClients);
    const tagDef = SWAGGER_TAG_DEFINITIONS.find(
      (tag) => tag.name === SWAGGER_TAG.CommandesClients,
    );
    expect(tagDef).toBeDefined();
    const tag = document.tags?.find(
      (entry) => entry.name === SWAGGER_TAG.CommandesClients,
    );
    expect(tag?.description).toBe(tagDef?.description);

    for (const def of SWAGGER_TAG_DEFINITIONS) {
      expectTagDefined(document, def.name);
    }
  });

  it('exposes bearer security scheme', () => {
    expect(document.components?.securitySchemes?.[SWAGGER_BEARER_AUTH]).toEqual(
      expect.objectContaining({
        type: 'http',
        scheme: 'bearer',
      }),
    );
  });

  it('tags sales-orders CRUD under Commandes clients', () => {
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders'],
      'get',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders'],
      'post',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders/{id}'],
      'get',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders/{id}'],
      'patch',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders/{id}'],
      'delete',
      SWAGGER_TAG.CommandesClients,
    );
  });

  it('tags items, transition and status-history', () => {
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders/{id}/items'],
      'get',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders/{id}/items'],
      'post',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders/{id}/items/{itemId}'],
      'patch',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders/{id}/transition'],
      'post',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders/{id}/status-history'],
      'get',
      SWAGGER_TAG.CommandesClients,
    );
  });

  it('tags payments and documents nested resources', () => {
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders/{orderId}/payments'],
      'get',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders/{orderId}/payments'],
      'post',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders/{orderId}/payments/{paymentLinkId}'],
      'patch',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders/{orderId}/payments/{paymentLinkId}'],
      'delete',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders/{orderId}/documents'],
      'get',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths['/api/v1/sales-orders/{orderId}/documents'],
      'post',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths[
        '/api/v1/sales-orders/{orderId}/documents/{documentLinkId}'
      ],
      'patch',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths[
        '/api/v1/sales-orders/{orderId}/documents/{documentLinkId}'
      ],
      'delete',
      SWAGGER_TAG.CommandesClients,
    );
  });

  it('tags convert routes under Commandes clients', () => {
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/convert-to-order'],
      'post',
      SWAGGER_TAG.CommandesClients,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/convert'],
      'post',
      SWAGGER_TAG.CommandesClients,
    );
  });
});
