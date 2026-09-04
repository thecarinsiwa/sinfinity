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

const TAXONOMY_CRUD = [
  {
    collection: '/api/v1/product-categories',
    item: '/api/v1/product-categories/{id}',
  },
  {
    collection: '/api/v1/product-subcategories',
    item: '/api/v1/product-subcategories/{id}',
  },
  {
    collection: '/api/v1/product-brands',
    item: '/api/v1/product-brands/{id}',
  },
  {
    collection: '/api/v1/product-models',
    item: '/api/v1/product-models/{id}',
  },
] as const;

describe('Phase 4 OpenAPI — Catalogue (e2e)', () => {
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

  it('registers Catalogue tag with description among Phase 0–4 tags', () => {
    expectTagDefined(document, SWAGGER_TAG.Catalogue);
    const catalogueTag = SWAGGER_TAG_DEFINITIONS.find(
      (tag) => tag.name === SWAGGER_TAG.Catalogue,
    );
    expect(catalogueTag).toBeDefined();
    const tag = document.tags?.find(
      (entry) => entry.name === SWAGGER_TAG.Catalogue,
    );
    expect(tag?.description).toBe(catalogueTag?.description);

    for (const def of SWAGGER_TAG_DEFINITIONS) {
      expectTagDefined(document, def.name);
    }
  });

  it('exposes bearer access-token security scheme', () => {
    expect(document.components?.securitySchemes?.[SWAGGER_BEARER_AUTH]).toEqual(
      expect.objectContaining({
        type: 'http',
        scheme: 'bearer',
      }),
    );
  });

  describe('taxonomy', () => {
    it('documents taxonomy CRUD with Catalogue tag and Bearer', () => {
      for (const resource of TAXONOMY_CRUD) {
        expectTaggedOperation(
          document.paths[resource.collection],
          'get',
          SWAGGER_TAG.Catalogue,
        );
        expectTaggedOperation(
          document.paths[resource.collection],
          'post',
          SWAGGER_TAG.Catalogue,
        );
        expectTaggedOperation(
          document.paths[resource.item],
          'get',
          SWAGGER_TAG.Catalogue,
        );
        expectTaggedOperation(
          document.paths[resource.item],
          'patch',
          SWAGGER_TAG.Catalogue,
        );
        expectTaggedOperation(
          document.paths[resource.item],
          'delete',
          SWAGGER_TAG.Catalogue,
        );
      }
    });

    it('documents category tree and product-units read-only', () => {
      expectTaggedOperation(
        document.paths['/api/v1/product-categories/tree'],
        'get',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/product-units'],
        'get',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/product-units/{id}'],
        'get',
        SWAGGER_TAG.Catalogue,
      );
      expect(document.paths['/api/v1/product-units']?.post).toBeUndefined();
    });
  });

  describe('products', () => {
    it('documents product CRUD with Catalogue tag and Bearer', () => {
      expectTaggedOperation(
        document.paths['/api/v1/products'],
        'get',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/products'],
        'post',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/products/{id}'],
        'get',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/products/{id}'],
        'patch',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/products/{id}'],
        'delete',
        SWAGGER_TAG.Catalogue,
      );
    });

    it('documents nested specifications and images', () => {
      expectTaggedOperation(
        document.paths['/api/v1/products/{id}/specifications'],
        'get',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/products/{id}/specifications'],
        'post',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/products/{id}/specifications/{specId}'],
        'patch',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/products/{id}/specifications/{specId}'],
        'delete',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/products/{id}/images'],
        'get',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/products/{id}/images'],
        'post',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/products/{id}/images/{imageId}'],
        'patch',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/products/{id}/images/{imageId}'],
        'delete',
        SWAGGER_TAG.Catalogue,
      );
    });
  });

  describe('services', () => {
    it('documents service_categories and services CRUD', () => {
      expectTaggedOperation(
        document.paths['/api/v1/service-categories'],
        'get',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/service-categories'],
        'post',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/service-categories/{id}'],
        'get',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/service-categories/{id}'],
        'patch',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/service-categories/{id}'],
        'delete',
        SWAGGER_TAG.Catalogue,
      );

      expectTaggedOperation(
        document.paths['/api/v1/services'],
        'get',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/services'],
        'post',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/services/{id}'],
        'get',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/services/{id}'],
        'patch',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/services/{id}'],
        'delete',
        SWAGGER_TAG.Catalogue,
      );
    });

    it('documents product_services nested under products', () => {
      expectTaggedOperation(
        document.paths['/api/v1/products/{productId}/services'],
        'get',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/products/{productId}/services'],
        'post',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/products/{productId}/services/{linkId}'],
        'patch',
        SWAGGER_TAG.Catalogue,
      );
      expectTaggedOperation(
        document.paths['/api/v1/products/{productId}/services/{linkId}'],
        'delete',
        SWAGGER_TAG.Catalogue,
      );
    });
  });
});
