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

const ORGANISATION_CRUD = [
  {
    collection: '/api/v1/organizations',
    item: '/api/v1/organizations/{id}',
  },
  {
    collection: '/api/v1/branches',
    item: '/api/v1/branches/{id}',
  },
  {
    collection: '/api/v1/users',
    item: '/api/v1/users/{id}',
  },
] as const;

describe('Phase 2 OpenAPI — Auth / Organisation / Sécurité (e2e)', () => {
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

  it('registers Phase 0–5 Swagger tags with descriptions', () => {
    for (const def of SWAGGER_TAG_DEFINITIONS) {
      expectTagDefined(document, def.name);
      const tag = document.tags?.find((entry) => entry.name === def.name);
      expect(tag?.description).toBe(def.description);
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

  describe('Auth', () => {
    it('documents public login/refresh/set-password without Bearer', () => {
      expectTaggedOperation(
        document.paths['/api/v1/auth/login'],
        'post',
        SWAGGER_TAG.Auth,
        { bearer: false },
      );
      expectTaggedOperation(
        document.paths['/api/v1/auth/refresh'],
        'post',
        SWAGGER_TAG.Auth,
        { bearer: false },
      );
      expectTaggedOperation(
        document.paths['/api/v1/auth/set-password'],
        'post',
        SWAGGER_TAG.Auth,
        { bearer: false },
      );
    });

    it('documents logout/me with Bearer', () => {
      expectTaggedOperation(
        document.paths['/api/v1/auth/logout'],
        'post',
        SWAGGER_TAG.Auth,
      );
      expectTaggedOperation(
        document.paths['/api/v1/auth/me'],
        'get',
        SWAGGER_TAG.Auth,
      );
    });
  });

  describe('Organisation', () => {
    it('documents CRUD resources with Organisation tag and Bearer', () => {
      for (const resource of ORGANISATION_CRUD) {
        expectTaggedOperation(
          document.paths[resource.collection],
          'get',
          SWAGGER_TAG.Organisation,
        );
        expectTaggedOperation(
          document.paths[resource.collection],
          'post',
          SWAGGER_TAG.Organisation,
        );
        expectTaggedOperation(
          document.paths[resource.item],
          'get',
          SWAGGER_TAG.Organisation,
        );
        expectTaggedOperation(
          document.paths[resource.item],
          'patch',
          SWAGGER_TAG.Organisation,
        );
        expectTaggedOperation(
          document.paths[resource.item],
          'delete',
          SWAGGER_TAG.Organisation,
        );
      }
    });

    it('documents user reset-password and system-settings', () => {
      expectTaggedOperation(
        document.paths['/api/v1/users/{id}/reset-password'],
        'post',
        SWAGGER_TAG.Organisation,
      );
      expectTaggedOperation(
        document.paths['/api/v1/system-settings'],
        'get',
        SWAGGER_TAG.Organisation,
      );
      expectTaggedOperation(
        document.paths['/api/v1/system-settings'],
        'put',
        SWAGGER_TAG.Organisation,
      );
      expectTaggedOperation(
        document.paths['/api/v1/system-settings/{key}'],
        'get',
        SWAGGER_TAG.Organisation,
      );
      expectTaggedOperation(
        document.paths['/api/v1/system-settings/{key}'],
        'put',
        SWAGGER_TAG.Organisation,
      );
    });
  });

  describe('Sécurité', () => {
    it('documents roles and permissions catalogue', () => {
      expectTaggedOperation(
        document.paths['/api/v1/permissions'],
        'get',
        SWAGGER_TAG.Securite,
      );
      expectTaggedOperation(
        document.paths['/api/v1/roles'],
        'get',
        SWAGGER_TAG.Securite,
      );
      expectTaggedOperation(
        document.paths['/api/v1/roles'],
        'post',
        SWAGGER_TAG.Securite,
      );
      expectTaggedOperation(
        document.paths['/api/v1/roles/{id}'],
        'get',
        SWAGGER_TAG.Securite,
      );
      expectTaggedOperation(
        document.paths['/api/v1/roles/{id}'],
        'patch',
        SWAGGER_TAG.Securite,
      );
      expectTaggedOperation(
        document.paths['/api/v1/roles/{id}'],
        'delete',
        SWAGGER_TAG.Securite,
      );
      expectTaggedOperation(
        document.paths['/api/v1/roles/{id}/permissions'],
        'put',
        SWAGGER_TAG.Securite,
      );
      expectTaggedOperation(
        document.paths['/api/v1/roles/{id}/permissions/{permissionId}'],
        'post',
        SWAGGER_TAG.Securite,
      );
      expectTaggedOperation(
        document.paths['/api/v1/roles/{id}/permissions/{permissionId}'],
        'delete',
        SWAGGER_TAG.Securite,
      );
    });

    it('documents user-roles, me/permissions and audit-logs', () => {
      expectTaggedOperation(
        document.paths['/api/v1/user-roles'],
        'get',
        SWAGGER_TAG.Securite,
      );
      expectTaggedOperation(
        document.paths['/api/v1/user-roles'],
        'post',
        SWAGGER_TAG.Securite,
      );
      expectTaggedOperation(
        document.paths['/api/v1/user-roles/{id}'],
        'delete',
        SWAGGER_TAG.Securite,
      );
      expectTaggedOperation(
        document.paths['/api/v1/me/permissions'],
        'get',
        SWAGGER_TAG.Securite,
      );
      expectTaggedOperation(
        document.paths['/api/v1/audit-logs'],
        'get',
        SWAGGER_TAG.Securite,
      );
    });
  });
});
