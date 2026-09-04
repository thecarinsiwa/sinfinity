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

describe('Phase 9 OpenAPI — Sourcing (e2e)', () => {
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

  it('registers Sourcing tag with description among Phase 0–9 tags', () => {
    expectTagDefined(document, SWAGGER_TAG.Sourcing);
    const tagDef = SWAGGER_TAG_DEFINITIONS.find(
      (tag) => tag.name === SWAGGER_TAG.Sourcing,
    );
    expect(tagDef).toBeDefined();
    const tag = document.tags?.find(
      (entry) => entry.name === SWAGGER_TAG.Sourcing,
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

  it('documents procurement response schemas', () => {
    expect(
      document.components?.schemas?.ProcurementRequestResponseDto,
    ).toBeDefined();
    expect(
      document.components?.schemas?.ProcurementQuoteResponseDto,
    ).toBeDefined();
    expect(
      document.components?.schemas?.ProcurementComparisonResponseDto,
    ).toBeDefined();
    expect(
      document.components?.schemas?.ProcurementApprovalResponseDto,
    ).toBeDefined();
  });

  it('tags procurement-requests CRUD and transition under Sourcing', () => {
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests'],
      'get',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests'],
      'post',
      SWAGGER_TAG.Sourcing,
    );
    expectImplementedResponse(
      document.paths['/api/v1/procurement-requests'],
      'post',
      '201',
    );
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{id}'],
      'get',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{id}'],
      'patch',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{id}'],
      'delete',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{id}/transition'],
      'post',
      SWAGGER_TAG.Sourcing,
    );
  });

  it('tags request items under Sourcing', () => {
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{id}/items'],
      'get',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{id}/items'],
      'post',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{id}/items/{itemId}'],
      'patch',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{id}/items/{itemId}'],
      'delete',
      SWAGGER_TAG.Sourcing,
    );
  });

  it('tags nested quotes and quote items under Sourcing', () => {
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{requestId}/quotes'],
      'get',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{requestId}/quotes'],
      'post',
      SWAGGER_TAG.Sourcing,
    );
    expectImplementedResponse(
      document.paths['/api/v1/procurement-requests/{requestId}/quotes'],
      'post',
      '201',
    );
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{requestId}/quotes/{quoteId}'],
      'get',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{requestId}/quotes/{quoteId}'],
      'patch',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{requestId}/quotes/{quoteId}'],
      'delete',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths[
        '/api/v1/procurement-requests/{requestId}/quotes/{quoteId}/transition'
      ],
      'post',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths[
        '/api/v1/procurement-requests/{requestId}/quotes/{quoteId}/items'
      ],
      'get',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths[
        '/api/v1/procurement-requests/{requestId}/quotes/{quoteId}/items'
      ],
      'post',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths[
        '/api/v1/procurement-requests/{requestId}/quotes/{quoteId}/items/{itemId}'
      ],
      'patch',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths[
        '/api/v1/procurement-requests/{requestId}/quotes/{quoteId}/items/{itemId}'
      ],
      'delete',
      SWAGGER_TAG.Sourcing,
    );
  });

  it('tags comparisons and approvals as implemented Sourcing ops (201)', () => {
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{requestId}/comparisons'],
      'get',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{requestId}/comparisons'],
      'post',
      SWAGGER_TAG.Sourcing,
    );
    expectImplementedResponse(
      document.paths['/api/v1/procurement-requests/{requestId}/comparisons'],
      'post',
      '201',
    );

    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{requestId}/approvals'],
      'get',
      SWAGGER_TAG.Sourcing,
    );
    expectTaggedOperation(
      document.paths['/api/v1/procurement-requests/{requestId}/approvals'],
      'post',
      SWAGGER_TAG.Sourcing,
    );
    expectImplementedResponse(
      document.paths['/api/v1/procurement-requests/{requestId}/approvals'],
      'post',
      '201',
    );
  });
});
