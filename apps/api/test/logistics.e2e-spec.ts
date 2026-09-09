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

describe('Phase 11 OpenAPI — Logistique (e2e)', () => {
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

  it('registers Logistique tag with description among Phase 0–11 tags', () => {
    expectTagDefined(document, SWAGGER_TAG.Logistique);
    const tagDef = SWAGGER_TAG_DEFINITIONS.find(
      (tag) => tag.name === SWAGGER_TAG.Logistique,
    );
    expect(tagDef).toBeDefined();
    const tag = document.tags?.find(
      (entry) => entry.name === SWAGGER_TAG.Logistique,
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

  it('documents Logistique response schemas', () => {
    expect(document.components?.schemas?.ShippingMethodResponseDto).toBeDefined();
    expect(document.components?.schemas?.CarrierResponseDto).toBeDefined();
    expect(document.components?.schemas?.ShipmentResponseDto).toBeDefined();
    expect(document.components?.schemas?.ShipmentItemResponseDto).toBeDefined();
    expect(
      document.components?.schemas?.ShipmentTrackingResponseDto,
    ).toBeDefined();
    expect(
      document.components?.schemas?.CustomsDeclarationResponseDto,
    ).toBeDefined();
    expect(document.components?.schemas?.CustomsDocumentResponseDto).toBeDefined();
    expect(document.components?.schemas?.ImportDocumentResponseDto).toBeDefined();
    expect(
      document.components?.schemas?.DeliveryAddressResponseDto,
    ).toBeDefined();
  });

  it('tags shipping-methods and carriers under Logistique', () => {
    expectTaggedOperation(
      document.paths['/api/v1/shipping-methods'],
      'get',
      SWAGGER_TAG.Logistique,
    );
    expectTaggedOperation(
      document.paths['/api/v1/shipping-methods'],
      'post',
      SWAGGER_TAG.Logistique,
    );
    expectImplementedResponse(
      document.paths['/api/v1/shipping-methods'],
      'post',
      '201',
    );

    for (const method of ['get', 'patch', 'delete'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/shipping-methods/{id}'],
        method,
        SWAGGER_TAG.Logistique,
      );
    }

    expectTaggedOperation(
      document.paths['/api/v1/carriers'],
      'get',
      SWAGGER_TAG.Logistique,
    );
    expectTaggedOperation(
      document.paths['/api/v1/carriers'],
      'post',
      SWAGGER_TAG.Logistique,
    );
    expectImplementedResponse(document.paths['/api/v1/carriers'], 'post', '201');

    for (const method of ['get', 'patch', 'delete'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/carriers/{id}'],
        method,
        SWAGGER_TAG.Logistique,
      );
    }
  });

  it('tags shipments CRUD, transition, items and tracking', () => {
    expectTaggedOperation(
      document.paths['/api/v1/shipments'],
      'get',
      SWAGGER_TAG.Logistique,
    );
    expectTaggedOperation(
      document.paths['/api/v1/shipments'],
      'post',
      SWAGGER_TAG.Logistique,
    );
    expectImplementedResponse(document.paths['/api/v1/shipments'], 'post', '201');

    for (const method of ['get', 'patch', 'delete'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/shipments/{id}'],
        method,
        SWAGGER_TAG.Logistique,
      );
    }

    expectTaggedOperation(
      document.paths['/api/v1/shipments/{id}/transition'],
      'post',
      SWAGGER_TAG.Logistique,
    );
    expectImplementedResponse(
      document.paths['/api/v1/shipments/{id}/transition'],
      'post',
      '200',
    );

    for (const method of ['get', 'post'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/shipments/{id}/items'],
        method,
        SWAGGER_TAG.Logistique,
      );
    }
    expectImplementedResponse(
      document.paths['/api/v1/shipments/{id}/items'],
      'post',
      '201',
    );
    for (const method of ['patch', 'delete'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/shipments/{id}/items/{itemId}'],
        method,
        SWAGGER_TAG.Logistique,
      );
    }

    for (const method of ['get', 'post'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/shipments/{id}/tracking'],
        method,
        SWAGGER_TAG.Logistique,
      );
    }
    expectImplementedResponse(
      document.paths['/api/v1/shipments/{id}/tracking'],
      'post',
      '201',
    );
    for (const method of ['patch', 'delete'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/shipments/{id}/tracking/{eventId}'],
        method,
        SWAGGER_TAG.Logistique,
      );
    }
  });

  it('tags customs declarations, documents and import-documents', () => {
    expectTaggedOperation(
      document.paths['/api/v1/customs-declarations'],
      'get',
      SWAGGER_TAG.Logistique,
    );
    expectTaggedOperation(
      document.paths['/api/v1/customs-declarations'],
      'post',
      SWAGGER_TAG.Logistique,
    );
    expectImplementedResponse(
      document.paths['/api/v1/customs-declarations'],
      'post',
      '201',
    );

    for (const method of ['get', 'patch', 'delete'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/customs-declarations/{id}'],
        method,
        SWAGGER_TAG.Logistique,
      );
    }

    for (const method of ['get', 'post'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/customs-declarations/{id}/documents'],
        method,
        SWAGGER_TAG.Logistique,
      );
    }
    expectImplementedResponse(
      document.paths['/api/v1/customs-declarations/{id}/documents'],
      'post',
      '201',
    );
    expectTaggedOperation(
      document.paths['/api/v1/customs-declarations/{id}/documents/{linkId}'],
      'delete',
      SWAGGER_TAG.Logistique,
    );

    for (const method of ['get', 'post'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/shipments/{shipmentId}/import-documents'],
        method,
        SWAGGER_TAG.Logistique,
      );
    }
    expectImplementedResponse(
      document.paths['/api/v1/shipments/{shipmentId}/import-documents'],
      'post',
      '201',
    );
    expectTaggedOperation(
      document.paths[
        '/api/v1/shipments/{shipmentId}/import-documents/{linkId}'
      ],
      'delete',
      SWAGGER_TAG.Logistique,
    );
  });

  it('tags delivery-addresses CRUD under Logistique', () => {
    expectTaggedOperation(
      document.paths['/api/v1/delivery-addresses'],
      'get',
      SWAGGER_TAG.Logistique,
    );
    expectTaggedOperation(
      document.paths['/api/v1/delivery-addresses'],
      'post',
      SWAGGER_TAG.Logistique,
    );
    expectImplementedResponse(
      document.paths['/api/v1/delivery-addresses'],
      'post',
      '201',
    );

    for (const method of ['get', 'patch', 'delete'] as const) {
      expectTaggedOperation(
        document.paths['/api/v1/delivery-addresses/{id}'],
        method,
        SWAGGER_TAG.Logistique,
      );
    }
  });
});
