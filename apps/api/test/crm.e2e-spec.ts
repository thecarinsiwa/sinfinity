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

const CRM_CRUD = [
  {
    collection: '/api/v1/customer-categories',
    item: '/api/v1/customer-categories/{id}',
  },
  {
    collection: '/api/v1/customers',
    item: '/api/v1/customers/{id}',
  },
  {
    collection: '/api/v1/lead-sources',
    item: '/api/v1/lead-sources/{id}',
  },
  {
    collection: '/api/v1/leads',
    item: '/api/v1/leads/{id}',
  },
  {
    collection: '/api/v1/opportunities',
    item: '/api/v1/opportunities/{id}',
  },
  {
    collection: '/api/v1/sales-activities',
    item: '/api/v1/sales-activities/{id}',
  },
] as const;

const CUSTOMER_NESTED = [
  {
    collection: '/api/v1/customers/{id}/contacts',
    item: '/api/v1/customers/{id}/contacts/{contactId}',
  },
  {
    collection: '/api/v1/customers/{id}/addresses',
    item: '/api/v1/customers/{id}/addresses/{addressId}',
  },
  {
    collection: '/api/v1/customers/{id}/notes',
    item: '/api/v1/customers/{id}/notes/{noteId}',
  },
] as const;

describe('Phase 5 OpenAPI — CRM (e2e)', () => {
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

  it('registers CRM tag with description among Phase 0–5 tags', () => {
    expectTagDefined(document, SWAGGER_TAG.Crm);
    const crmTag = SWAGGER_TAG_DEFINITIONS.find(
      (tag) => tag.name === SWAGGER_TAG.Crm,
    );
    expect(crmTag).toBeDefined();
    const tag = document.tags?.find((entry) => entry.name === SWAGGER_TAG.Crm);
    expect(tag?.description).toBe(crmTag?.description);

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

  describe('core collections', () => {
    it.each(CRM_CRUD)(
      'documents CRUD $collection with CRM tag and Bearer',
      ({ collection, item }) => {
        expectTaggedOperation(
          document.paths[collection],
          'get',
          SWAGGER_TAG.Crm,
        );
        expectTaggedOperation(
          document.paths[collection],
          'post',
          SWAGGER_TAG.Crm,
        );
        expectTaggedOperation(document.paths[item], 'get', SWAGGER_TAG.Crm);
        expectTaggedOperation(document.paths[item], 'patch', SWAGGER_TAG.Crm);
        expectTaggedOperation(document.paths[item], 'delete', SWAGGER_TAG.Crm);
      },
    );
  });

  describe('customers nested', () => {
    it.each(CUSTOMER_NESTED)(
      'documents nested $collection with CRM tag and Bearer',
      ({ collection, item }) => {
        expectTaggedOperation(
          document.paths[collection],
          'get',
          SWAGGER_TAG.Crm,
        );
        expectTaggedOperation(
          document.paths[collection],
          'post',
          SWAGGER_TAG.Crm,
        );
        expectTaggedOperation(document.paths[item], 'patch', SWAGGER_TAG.Crm);
        expectTaggedOperation(document.paths[item], 'delete', SWAGGER_TAG.Crm);
      },
    );
  });

  describe('leads convert', () => {
    it('documents POST /leads/{id}/convert with CRM tag and Bearer', () => {
      expectTaggedOperation(
        document.paths['/api/v1/leads/{id}/convert'],
        'post',
        SWAGGER_TAG.Crm,
      );
    });
  });

  describe('opportunity items', () => {
    it('documents nested items CRUD with CRM tag and Bearer', () => {
      expectTaggedOperation(
        document.paths['/api/v1/opportunities/{id}/items'],
        'get',
        SWAGGER_TAG.Crm,
      );
      expectTaggedOperation(
        document.paths['/api/v1/opportunities/{id}/items'],
        'post',
        SWAGGER_TAG.Crm,
      );
      expectTaggedOperation(
        document.paths['/api/v1/opportunities/{id}/items/{itemId}'],
        'patch',
        SWAGGER_TAG.Crm,
      );
      expectTaggedOperation(
        document.paths['/api/v1/opportunities/{id}/items/{itemId}'],
        'delete',
        SWAGGER_TAG.Crm,
      );
    });
  });

  describe('activity types', () => {
    it('documents activity-types as read-only under CRM with Bearer', () => {
      expectTaggedOperation(
        document.paths['/api/v1/activity-types'],
        'get',
        SWAGGER_TAG.Crm,
      );
      expectTaggedOperation(
        document.paths['/api/v1/activity-types/{id}'],
        'get',
        SWAGGER_TAG.Crm,
      );
      expect(document.paths['/api/v1/activity-types']?.post).toBeUndefined();
      expect(document.paths['/api/v1/activity-types/{id}']?.patch).toBeUndefined();
      expect(
        document.paths['/api/v1/activity-types/{id}']?.delete,
      ).toBeUndefined();
    });
  });
});
