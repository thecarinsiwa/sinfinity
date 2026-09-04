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
  type OpenApiPathItem,
} from './openapi-helpers';
import { TestJwtAuthGuard } from './test-jwt-auth.guard';

describe('Phase 3 OpenAPI — Documents (e2e)', () => {
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

  it('registers Documents tag with description among Phase 0–4 tags', () => {
    expectTagDefined(document, SWAGGER_TAG.Documents);
    const documentsTag = SWAGGER_TAG_DEFINITIONS.find(
      (tag) => tag.name === SWAGGER_TAG.Documents,
    );
    expect(documentsTag).toBeDefined();
    const tag = document.tags?.find(
      (entry) => entry.name === SWAGGER_TAG.Documents,
    );
    expect(tag?.description).toBe(documentsTag?.description);

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

  describe('document-types', () => {
    it('documents CRUD with Documents tag and Bearer', () => {
      expectTaggedOperation(
        document.paths['/api/v1/document-types'],
        'get',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/document-types'],
        'post',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/document-types/{id}'],
        'get',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/document-types/{id}'],
        'patch',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/document-types/{id}'],
        'delete',
        SWAGGER_TAG.Documents,
      );
    });
  });

  describe('documents (files)', () => {
    it('documents list/get/patch/delete with Documents tag and Bearer', () => {
      expectTaggedOperation(
        document.paths['/api/v1/documents'],
        'get',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/documents/{id}'],
        'get',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/documents/{id}'],
        'patch',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/documents/{id}'],
        'delete',
        SWAGGER_TAG.Documents,
      );
    });

    it('documents multipart upload, versions and download', () => {
      expectTaggedOperation(
        document.paths['/api/v1/documents'],
        'post',
        SWAGGER_TAG.Documents,
      );
      expectMultipart(document.paths['/api/v1/documents'], 'post');

      expectTaggedOperation(
        document.paths['/api/v1/documents/{id}/versions'],
        'get',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/documents/{id}/versions'],
        'post',
        SWAGGER_TAG.Documents,
      );
      expectMultipart(document.paths['/api/v1/documents/{id}/versions'], 'post');

      expectTaggedOperation(
        document.paths['/api/v1/documents/{id}/download'],
        'get',
        SWAGGER_TAG.Documents,
      );
    });
  });

  describe('document-links', () => {
    it('documents GET/POST collection and DELETE item', () => {
      expectTaggedOperation(
        document.paths['/api/v1/document-links'],
        'get',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/document-links'],
        'post',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/document-links/{id}'],
        'delete',
        SWAGGER_TAG.Documents,
      );
    });
  });

  describe('contracts', () => {
    it('documents contract CRUD with Documents tag and Bearer', () => {
      expectTaggedOperation(
        document.paths['/api/v1/contracts'],
        'get',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/contracts'],
        'post',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/contracts/{id}'],
        'get',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/contracts/{id}'],
        'patch',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/contracts/{id}'],
        'delete',
        SWAGGER_TAG.Documents,
      );
    });

    it('documents contract_items nested routes', () => {
      expectTaggedOperation(
        document.paths['/api/v1/contracts/{id}/items'],
        'get',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/contracts/{id}/items'],
        'post',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/contracts/{id}/items/{itemId}'],
        'patch',
        SWAGGER_TAG.Documents,
      );
      expectTaggedOperation(
        document.paths['/api/v1/contracts/{id}/items/{itemId}'],
        'delete',
        SWAGGER_TAG.Documents,
      );
    });
  });
});

function expectMultipart(
  pathItem: OpenApiPathItem | undefined,
  method: string,
): void {
  expect(pathItem).toBeDefined();
  const operation = pathItem?.[method] as
    | { consumes?: string[]; requestBody?: { content?: Record<string, unknown> } }
    | undefined;
  expect(operation).toBeDefined();

  const contentTypes = operation?.requestBody?.content
    ? Object.keys(operation.requestBody.content)
    : (operation?.consumes ?? []);

  expect(contentTypes).toEqual(
    expect.arrayContaining(['multipart/form-data']),
  );
}
