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

describe('Phase 7 OpenAPI — Devis (e2e)', () => {
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

  it('registers Devis tag with description among Phase 0–8 tags', () => {
    expectTagDefined(document, SWAGGER_TAG.Devis);
    expectTagDefined(document, SWAGGER_TAG.CommandesClients);
    const devisTag = SWAGGER_TAG_DEFINITIONS.find(
      (tag) => tag.name === SWAGGER_TAG.Devis,
    );
    expect(devisTag).toBeDefined();
    const tag = document.tags?.find(
      (entry) => entry.name === SWAGGER_TAG.Devis,
    );
    expect(tag?.description).toBe(devisTag?.description);

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

  it('tags quotation-statuses as read-only under Devis', () => {
    expectTaggedOperation(
      document.paths['/api/v1/quotation-statuses'],
      'get',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotation-statuses/{id}'],
      'get',
      SWAGGER_TAG.Devis,
    );
    expect(document.paths['/api/v1/quotation-statuses']?.post).toBeUndefined();
    expect(
      document.paths['/api/v1/quotation-statuses/{id}']?.patch,
    ).toBeUndefined();
    expect(
      document.paths['/api/v1/quotation-statuses/{id}']?.delete,
    ).toBeUndefined();
  });

  it('tags quotations CRUD under Devis with bearer', () => {
    expectTaggedOperation(
      document.paths['/api/v1/quotations'],
      'get',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations'],
      'post',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}'],
      'get',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}'],
      'patch',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}'],
      'delete',
      SWAGGER_TAG.Devis,
    );
  });

  it('tags quotation items and terms under Devis', () => {
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/items'],
      'get',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/items'],
      'post',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/items/{itemId}'],
      'patch',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/items/{itemId}'],
      'delete',
      SWAGGER_TAG.Devis,
    );

    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/terms'],
      'get',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/terms'],
      'put',
      SWAGGER_TAG.Devis,
    );
  });

  it('tags quotation versions and revise under Devis', () => {
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/versions'],
      'get',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/versions/{versionNumber}'],
      'get',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/revise'],
      'post',
      SWAGGER_TAG.Devis,
    );
  });

  it('tags approval and status workflow under Devis', () => {
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/approvals'],
      'get',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/submit-for-approval'],
      'post',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/approve'],
      'post',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/reject'],
      'post',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/send'],
      'post',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/mark-accepted'],
      'post',
      SWAGGER_TAG.Devis,
    );
    expectTaggedOperation(
      document.paths['/api/v1/quotations/{id}/mark-rejected'],
      'post',
      SWAGGER_TAG.Devis,
    );
  });

  it('documents convert and convert-to-order as real Commandes clients ops (201, not 501 stub)', () => {
    for (const path of [
      '/api/v1/quotations/{id}/convert-to-order',
      '/api/v1/quotations/{id}/convert',
    ] as const) {
      expectTaggedOperation(
        document.paths[path],
        'post',
        SWAGGER_TAG.CommandesClients,
      );
      expectImplementedResponse(document.paths[path], 'post', '201');
      // Still under quotations path but not the Devis tag alone as a stub.
      expect(document.paths[path]?.post?.tags).not.toEqual(['Devis']);
    }
  });
});
