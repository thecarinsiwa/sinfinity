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
  expectImplementedResponse,
  expectTagDefined,
  expectTaggedOperation,
  type OpenApiDocument,
} from './openapi-helpers';
import { TestJwtAuthGuard } from './test-jwt-auth.guard';

describe('Phase 10 OpenAPI — Achats (e2e)', () => {
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

  it('registers Achats tag with description among Phase 0–10 tags', () => {
    expectTagDefined(document, SWAGGER_TAG.Achats);
    const tagDef = SWAGGER_TAG_DEFINITIONS.find(
      (tag) => tag.name === SWAGGER_TAG.Achats,
    );
    expect(tagDef).toBeDefined();
    const tag = document.tags?.find((entry) => entry.name === SWAGGER_TAG.Achats);
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

  it('documents Achats response schemas', () => {
    expect(document.components?.schemas?.PurchaseOrderResponseDto).toBeDefined();
    expect(
      document.components?.schemas?.PurchaseOrderPaymentResponseDto,
    ).toBeDefined();
    expect(document.components?.schemas?.PurchaseReceiptResponseDto).toBeDefined();
  });

  it('tags purchase-orders CRUD, from-quote, items, workflow under Achats', () => {
    expectTaggedOperation(
      document.paths['/api/v1/purchase-orders'],
      'get',
      SWAGGER_TAG.Achats,
    );
    expectTaggedOperation(
      document.paths['/api/v1/purchase-orders'],
      'post',
      SWAGGER_TAG.Achats,
    );
    expectImplementedResponse(document.paths['/api/v1/purchase-orders'], 'post', '201');

    expectTaggedOperation(
      document.paths['/api/v1/purchase-orders/from-quote'],
      'post',
      SWAGGER_TAG.Achats,
    );
    expectImplementedResponse(
      document.paths['/api/v1/purchase-orders/from-quote'],
      'post',
      '201',
    );

    expectTaggedOperation(
      document.paths['/api/v1/purchase-orders/{id}'],
      'get',
      SWAGGER_TAG.Achats,
    );
    expectTaggedOperation(
      document.paths['/api/v1/purchase-orders/{id}'],
      'patch',
      SWAGGER_TAG.Achats,
    );
    expectTaggedOperation(
      document.paths['/api/v1/purchase-orders/{id}'],
      'delete',
      SWAGGER_TAG.Achats,
    );

    for (const method of ['get', 'post'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/purchase-orders/{id}/items'],
        method,
        SWAGGER_TAG.Achats,
      );
    }
    for (const method of ['patch', 'delete'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/purchase-orders/{id}/items/{itemId}'],
        method,
        SWAGGER_TAG.Achats,
      );
    }

    expectTaggedOperation(
      document.paths['/api/v1/purchase-orders/{id}/transition'],
      'post',
      SWAGGER_TAG.Achats,
    );
    expectTaggedOperation(
      document.paths['/api/v1/purchase-orders/{id}/status-history'],
      'get',
      SWAGGER_TAG.Achats,
    );
  });

  it('tags purchase order payments nested resources', () => {
    for (const method of ['get', 'post'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/purchase-orders/{orderId}/payments'],
        method,
        SWAGGER_TAG.Achats,
      );
    }
    for (const method of ['patch', 'delete'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/purchase-orders/{orderId}/payments/{paymentId}'],
        method,
        SWAGGER_TAG.Achats,
      );
    }
  });

  it('tags purchase receipts CRUD and confirm', () => {
    expectTaggedOperation(
      document.paths['/api/v1/purchase-receipts'],
      'get',
      SWAGGER_TAG.Achats,
    );
    expectTaggedOperation(
      document.paths['/api/v1/purchase-receipts'],
      'post',
      SWAGGER_TAG.Achats,
    );
    expectImplementedResponse(
      document.paths['/api/v1/purchase-receipts'],
      'post',
      '201',
    );

    expectTaggedOperation(
      document.paths['/api/v1/purchase-receipts/{id}'],
      'get',
      SWAGGER_TAG.Achats,
    );
    expectTaggedOperation(
      document.paths['/api/v1/purchase-receipts/{id}'],
      'patch',
      SWAGGER_TAG.Achats,
    );
    expectTaggedOperation(
      document.paths['/api/v1/purchase-receipts/{id}'],
      'delete',
      SWAGGER_TAG.Achats,
    );

    expectTaggedOperation(
      document.paths['/api/v1/purchase-receipts/{id}/confirm'],
      'post',
      SWAGGER_TAG.Achats,
    );
    expectImplementedResponse(
      document.paths['/api/v1/purchase-receipts/{id}/confirm'],
      'post',
      '200',
    );
  });
});

