import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/config/configure-app';
import { Env } from './../src/config/env.validation';
import { setupSwagger } from './../src/config/setup-swagger';
import { MYSQL_POOL } from './../src/database/database.constants';
import { readPackageVersion } from './../src/health/package-version';
import { JwtAuthGuard } from './../src/modules/auth/jwt-auth.guard';
import { TestJwtAuthGuard } from './test-jwt-auth.guard';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const poolQuery = jest.fn().mockResolvedValue([[{ 1: 1 }]]);

  beforeEach(async () => {
    poolQuery.mockReset();
    poolQuery.mockResolvedValue([[{ 1: 1 }]]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MYSQL_POOL)
      .useValue({
        query: poolQuery,
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
  });

  it('/api/v1/ping (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/ping')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/api/v1/health (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(res.body).toEqual({
      status: 'up',
      database: 'up',
      version: readPackageVersion(),
    });
    expect(poolQuery).toHaveBeenCalledWith('SELECT 1');
  });

  it('/api/v1/health (GET) returns 503 when MySQL is down', async () => {
    poolQuery.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(503)
      .expect({
        statusCode: 503,
        message: 'Database unavailable',
        error: 'Service Unavailable',
      });
  });

  it('/docs (GET) is outside the /api/v1 prefix', async () => {
    const res = await request(app.getHttpServer()).get('/docs').expect(200);
    const contentType = String(res.headers['content-type']);

    expect(contentType).toMatch(/html/);
  });

  it('/api/docs (GET) serves the Swagger UI', async () => {
    const res = await request(app.getHttpServer()).get('/api/docs').expect(200);
    const contentType = String(res.headers['content-type']);

    expect(contentType).toMatch(/html/);
  });

  it('/api/docs/ (GET) serves the Swagger UI with a trailing slash', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs/')
      .expect(200);
    const contentType = String(res.headers['content-type']);

    expect(contentType).toMatch(/html/);
  });

  it('/api/v1/docs is not the Swagger UI', () => {
    return request(app.getHttpServer()).get('/api/v1/docs').expect(404);
  });

  it('/api/v1/docs-json is not the OpenAPI spec', () => {
    return request(app.getHttpServer()).get('/api/v1/docs-json').expect(404);
  });

  it('/docs-json (GET) smoke: Phase 0–6 tags and security scheme', async () => {
    const res = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);

    const body = res.body as {
      info: { title: string; version: string };
      tags?: { name: string }[];
      paths: Record<string, unknown>;
      components: {
        securitySchemes: Record<string, { type: string; scheme: string }>;
      };
    };

    expect(body.info.title).toBe('Sinfinity API');
    expect(body.info.version).toBe('1.0');
    expect(body.paths['/api/v1/ping']).toBeDefined();
    expect(body.paths['/api/v1/health']).toBeDefined();
    expect(body.paths['/api/v1/document-types']).toBeDefined();
    expect(body.paths['/api/v1/documents']).toBeDefined();
    expect(body.paths['/api/v1/documents/{id}']).toBeDefined();
    expect(body.paths['/api/v1/documents/{id}/download']).toBeDefined();
    expect(body.paths['/api/v1/documents/{id}/versions']).toBeDefined();
    expect(body.paths['/api/v1/document-links']).toBeDefined();
    expect(body.paths['/api/v1/document-links/{id}']).toBeDefined();
    expect(body.paths['/api/v1/contracts']).toBeDefined();
    expect(body.paths['/api/v1/contracts/{id}']).toBeDefined();
    expect(body.paths['/api/v1/contracts/{id}/items']).toBeDefined();
    expect(body.paths['/api/v1/contracts/{id}/items/{itemId}']).toBeDefined();
    expect(body.paths['/api/v1/product-categories']).toBeDefined();
    expect(body.paths['/api/v1/product-categories/tree']).toBeDefined();
    expect(body.paths['/api/v1/product-subcategories']).toBeDefined();
    expect(body.paths['/api/v1/product-brands']).toBeDefined();
    expect(body.paths['/api/v1/product-models']).toBeDefined();
    expect(body.paths['/api/v1/product-units']).toBeDefined();
    expect(body.paths['/api/v1/products']).toBeDefined();
    expect(body.paths['/api/v1/products/{id}']).toBeDefined();
    expect(body.paths['/api/v1/products/{id}/specifications']).toBeDefined();
    expect(
      body.paths['/api/v1/products/{id}/specifications/{specId}'],
    ).toBeDefined();
    expect(body.paths['/api/v1/products/{id}/images']).toBeDefined();
    expect(body.paths['/api/v1/products/{id}/images/{imageId}']).toBeDefined();
    expect(body.paths['/api/v1/service-categories']).toBeDefined();
    expect(body.paths['/api/v1/services']).toBeDefined();
    expect(body.paths['/api/v1/products/{productId}/services']).toBeDefined();
    expect(
      body.paths['/api/v1/products/{productId}/services/{linkId}'],
    ).toBeDefined();
    expect(body.paths['/api/v1/customer-categories']).toBeDefined();
    expect(body.paths['/api/v1/customers']).toBeDefined();
    expect(body.paths['/api/v1/customers/{id}']).toBeDefined();
    expect(body.paths['/api/v1/customers/{id}/contacts']).toBeDefined();
    expect(
      body.paths['/api/v1/customers/{id}/contacts/{contactId}'],
    ).toBeDefined();
    expect(body.paths['/api/v1/customers/{id}/addresses']).toBeDefined();
    expect(
      body.paths['/api/v1/customers/{id}/addresses/{addressId}'],
    ).toBeDefined();
    expect(body.paths['/api/v1/customers/{id}/notes']).toBeDefined();
    expect(body.paths['/api/v1/customers/{id}/notes/{noteId}']).toBeDefined();
    expect(body.paths['/api/v1/lead-sources']).toBeDefined();
    expect(body.paths['/api/v1/leads']).toBeDefined();
    expect(body.paths['/api/v1/leads/{id}']).toBeDefined();
    expect(body.paths['/api/v1/leads/{id}/convert']).toBeDefined();
    expect(body.paths['/api/v1/opportunities']).toBeDefined();
    expect(body.paths['/api/v1/opportunities/{id}']).toBeDefined();
    expect(body.paths['/api/v1/opportunities/{id}/items']).toBeDefined();
    expect(
      body.paths['/api/v1/opportunities/{id}/items/{itemId}'],
    ).toBeDefined();
    expect(body.paths['/api/v1/activity-types']).toBeDefined();
    expect(body.paths['/api/v1/sales-activities']).toBeDefined();
    expect(body.paths['/api/v1/sales-activities/{id}']).toBeDefined();
    expect(body.paths['/api/v1/supplier-categories']).toBeDefined();
    expect(body.paths['/api/v1/supplier-categories/{id}']).toBeDefined();
    expect(body.paths['/api/v1/suppliers']).toBeDefined();
    expect(body.paths['/api/v1/suppliers/{id}']).toBeDefined();
    expect(body.paths['/api/v1/suppliers/{id}/contacts']).toBeDefined();
    expect(
      body.paths['/api/v1/suppliers/{id}/contacts/{contactId}'],
    ).toBeDefined();
    expect(body.paths['/api/v1/suppliers/{id}/addresses']).toBeDefined();
    expect(
      body.paths['/api/v1/suppliers/{id}/addresses/{addressId}'],
    ).toBeDefined();
    expect(body.paths['/api/v1/suppliers/{id}/payment-terms']).toBeDefined();
    expect(
      body.paths['/api/v1/suppliers/{id}/payment-terms/{termId}'],
    ).toBeDefined();
    expect(body.paths['/api/v1/supplier-products']).toBeDefined();
    expect(body.paths['/api/v1/supplier-products/{id}']).toBeDefined();
    expect(body.paths['/api/v1/supplier-evaluations']).toBeDefined();
    expect(body.paths['/api/v1/supplier-evaluations/{id}']).toBeDefined();
    expect(body.paths['/api/v1/suppliers/{supplierId}/documents']).toBeDefined();
    expect(
      body.paths['/api/v1/suppliers/{supplierId}/documents/{documentLinkId}'],
    ).toBeDefined();
    expect(body.paths['/api/v1/supplier-histories']).toBeDefined();
    expect(body.paths['/api/v1/quotation-statuses']).toBeDefined();
    expect(body.paths['/api/v1/quotation-statuses/{id}']).toBeDefined();
    expect(body.paths['/api/v1/quotations']).toBeDefined();
    expect(body.paths['/api/v1/quotations/{id}']).toBeDefined();
    expect(body.paths['/api/v1/quotations/{id}/items']).toBeDefined();
    expect(
      body.paths['/api/v1/quotations/{id}/items/{itemId}'],
    ).toBeDefined();
    expect(body.paths['/api/v1/quotations/{id}/terms']).toBeDefined();
    expect(body.paths['/api/v1/quotations/{id}/versions']).toBeDefined();
    expect(
      body.paths['/api/v1/quotations/{id}/versions/{versionNumber}'],
    ).toBeDefined();
    expect(body.paths['/api/v1/quotations/{id}/revise']).toBeDefined();
    expect(body.paths['/api/v1/quotations/{id}/approvals']).toBeDefined();
    expect(
      body.paths['/api/v1/quotations/{id}/submit-for-approval'],
    ).toBeDefined();
    expect(body.paths['/api/v1/quotations/{id}/approve']).toBeDefined();
    expect(body.paths['/api/v1/quotations/{id}/reject']).toBeDefined();
    expect(body.paths['/api/v1/quotations/{id}/send']).toBeDefined();
    expect(body.paths['/api/v1/quotations/{id}/mark-accepted']).toBeDefined();
    expect(body.paths['/api/v1/quotations/{id}/mark-rejected']).toBeDefined();
    expect(body.paths['/api/v1/quotations/{id}/convert']).toBeDefined();
    expect(body.paths['/api/v1/quotations/{id}/convert-to-order']).toBeDefined();
    expect(
      body.paths['/api/v1/quotations/{id}/convert']?.post?.responses?.['201'],
    ).toBeDefined();
    expect(
      body.paths['/api/v1/quotations/{id}/convert']?.post?.responses?.['501'],
    ).toBeUndefined();
    expect(
      body.paths['/api/v1/quotations/{id}/convert-to-order']?.post?.responses?.[
        '201'
      ],
    ).toBeDefined();
    expect(
      body.paths['/api/v1/quotations/{id}/convert-to-order']?.post?.responses?.[
        '501'
      ],
    ).toBeUndefined();
    expect(body.paths['/api/v1/sales-orders']).toBeDefined();
    expect(body.paths['/api/v1/sales-orders/{id}']).toBeDefined();
    expect(body.paths['/api/v1/sales-orders/{id}/items']).toBeDefined();
    expect(
      body.paths['/api/v1/sales-orders/{id}/items/{itemId}'],
    ).toBeDefined();
    expect(body.paths['/api/v1/sales-orders/{id}/transition']).toBeDefined();
    expect(
      body.paths['/api/v1/sales-orders/{id}/status-history'],
    ).toBeDefined();
    expect(
      body.paths['/api/v1/sales-orders/{orderId}/payments'],
    ).toBeDefined();
    expect(
      body.paths['/api/v1/sales-orders/{orderId}/payments/{paymentLinkId}'],
    ).toBeDefined();
    expect(
      body.paths['/api/v1/sales-orders/{orderId}/documents'],
    ).toBeDefined();
    expect(
      body.paths[
        '/api/v1/sales-orders/{orderId}/documents/{documentLinkId}'
      ],
    ).toBeDefined();
    expect(body.tags?.map((tag) => tag.name)).toEqual(
      expect.arrayContaining([
        'Health',
        'Settings',
        'Auth',
        'Organisation',
        'Sécurité',
        'Documents',
        'Catalogue',
        'CRM',
        'Fournisseurs',
        'Devis',
        'Commandes clients',
      ]),
    );
    expect(body.components.securitySchemes['access-token']).toEqual(
      expect.objectContaining({
        type: 'http',
        scheme: 'bearer',
      }),
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
