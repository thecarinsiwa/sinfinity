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

const SUPPLIERS_CRUD = [
  {
    collection: '/api/v1/supplier-categories',
    item: '/api/v1/supplier-categories/{id}',
  },
  {
    collection: '/api/v1/suppliers',
    item: '/api/v1/suppliers/{id}',
  },
  {
    collection: '/api/v1/supplier-products',
    item: '/api/v1/supplier-products/{id}',
  },
  {
    collection: '/api/v1/supplier-evaluations',
    item: '/api/v1/supplier-evaluations/{id}',
  },
] as const;

describe('Phase 6 OpenAPI — Fournisseurs (e2e)', () => {
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

  it('registers Fournisseurs tag with description among Phase 0–6 tags', () => {
    expectTagDefined(document, SWAGGER_TAG.Fournisseurs);
    const fournisseursTag = SWAGGER_TAG_DEFINITIONS.find(
      (tag) => tag.name === SWAGGER_TAG.Fournisseurs,
    );
    expect(fournisseursTag).toBeDefined();
    const tag = document.tags?.find(
      (entry) => entry.name === SWAGGER_TAG.Fournisseurs,
    );
    expect(tag?.description).toBe(fournisseursTag?.description);

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

  it.each(SUPPLIERS_CRUD)(
    'tags CRUD $collection under Fournisseurs with bearer',
    ({ collection, item }) => {
      expectTaggedOperation(
        document.paths[collection],
        'get',
        SWAGGER_TAG.Fournisseurs,
      );
      expectTaggedOperation(
        document.paths[collection],
        'post',
        SWAGGER_TAG.Fournisseurs,
      );
      expectTaggedOperation(
        document.paths[item],
        'get',
        SWAGGER_TAG.Fournisseurs,
      );
      expectTaggedOperation(
        document.paths[item],
        'patch',
        SWAGGER_TAG.Fournisseurs,
      );
      expectTaggedOperation(
        document.paths[item],
        'delete',
        SWAGGER_TAG.Fournisseurs,
      );
    },
  );

  it('tags supplier nested contacts/addresses/payment-terms under Fournisseurs', () => {
    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{id}/contacts'],
      'get',
      SWAGGER_TAG.Fournisseurs,
    );
    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{id}/contacts'],
      'post',
      SWAGGER_TAG.Fournisseurs,
    );
    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{id}/contacts/{contactId}'],
      'patch',
      SWAGGER_TAG.Fournisseurs,
    );
    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{id}/contacts/{contactId}'],
      'delete',
      SWAGGER_TAG.Fournisseurs,
    );

    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{id}/addresses'],
      'get',
      SWAGGER_TAG.Fournisseurs,
    );
    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{id}/addresses'],
      'post',
      SWAGGER_TAG.Fournisseurs,
    );
    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{id}/addresses/{addressId}'],
      'patch',
      SWAGGER_TAG.Fournisseurs,
    );
    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{id}/addresses/{addressId}'],
      'delete',
      SWAGGER_TAG.Fournisseurs,
    );

    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{id}/payment-terms'],
      'get',
      SWAGGER_TAG.Fournisseurs,
    );
    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{id}/payment-terms'],
      'post',
      SWAGGER_TAG.Fournisseurs,
    );
    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{id}/payment-terms/{termId}'],
      'patch',
      SWAGGER_TAG.Fournisseurs,
    );
    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{id}/payment-terms/{termId}'],
      'delete',
      SWAGGER_TAG.Fournisseurs,
    );
  });

  it('tags supplier documents under Fournisseurs', () => {
    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{supplierId}/documents'],
      'get',
      SWAGGER_TAG.Fournisseurs,
    );
    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{supplierId}/documents'],
      'post',
      SWAGGER_TAG.Fournisseurs,
    );
    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{supplierId}/documents/{documentLinkId}'],
      'patch',
      SWAGGER_TAG.Fournisseurs,
    );
    expectTaggedOperation(
      document.paths['/api/v1/suppliers/{supplierId}/documents/{documentLinkId}'],
      'delete',
      SWAGGER_TAG.Fournisseurs,
    );
  });

  it('tags supplier-histories as append-only under Fournisseurs', () => {
    expectTaggedOperation(
      document.paths['/api/v1/supplier-histories'],
      'get',
      SWAGGER_TAG.Fournisseurs,
    );
    expectTaggedOperation(
      document.paths['/api/v1/supplier-histories'],
      'post',
      SWAGGER_TAG.Fournisseurs,
    );
    expect(document.paths['/api/v1/supplier-histories']?.patch).toBeUndefined();
    expect(document.paths['/api/v1/supplier-histories']?.delete).toBeUndefined();
    expect(
      document.paths['/api/v1/supplier-histories/{id}'],
    ).toBeUndefined();
  });
});
