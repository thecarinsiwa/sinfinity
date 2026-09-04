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
import { MYSQL_POOL } from '../src/database/database.constants';
import { CitiesService } from '../src/modules/settings/cities/cities.service';
import { CountriesService } from '../src/modules/settings/countries/countries.service';
import { CurrenciesService } from '../src/modules/settings/currencies/currencies.service';
import { ExchangeRatesService } from '../src/modules/settings/exchange-rates/exchange-rates.service';
import { PaymentTermsService } from '../src/modules/settings/payment-terms/payment-terms.service';
import { ShippingTermsService } from '../src/modules/settings/shipping-terms/shipping-terms.service';
import { TaxesService } from '../src/modules/settings/taxes/taxes.service';
import { UnitsService } from '../src/modules/settings/units/units.service';

type OpenApiPathItem = Record<
  string,
  {
    tags?: string[];
    security?: Array<Record<string, unknown[]>>;
  }
>;

type OpenApiDocument = {
  tags?: { name: string }[];
  paths: Record<string, OpenApiPathItem>;
};

const emptyPage = {
  data: [],
  meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
};

function stubListService() {
  return {
    findAll: jest.fn().mockResolvedValue(emptyPage),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findLatest: jest.fn(),
    findIdByCode: jest.fn(),
  };
}

const SETTINGS_CRUD_PATHS = [
  {
    collection: '/api/v1/countries',
    item: '/api/v1/countries/{id}',
  },
  {
    collection: '/api/v1/cities',
    item: '/api/v1/cities/{id}',
  },
  {
    collection: '/api/v1/currencies',
    item: '/api/v1/currencies/{id}',
  },
  {
    collection: '/api/v1/exchange-rates',
    item: '/api/v1/exchange-rates/{id}',
  },
  {
    collection: '/api/v1/taxes',
    item: '/api/v1/taxes/{id}',
  },
  {
    collection: '/api/v1/units',
    item: '/api/v1/units/{id}',
  },
  {
    collection: '/api/v1/payment-terms',
    item: '/api/v1/payment-terms/{id}',
  },
  {
    collection: '/api/v1/shipping-terms',
    item: '/api/v1/shipping-terms/{id}',
  },
] as const;

function expectSettingsOperation(
  pathItem: OpenApiPathItem | undefined,
  method: string,
): void {
  expect(pathItem).toBeDefined();
  const operation = pathItem?.[method];
  expect(operation).toBeDefined();
  expect(operation?.tags).toContain('Settings');
  expect(operation?.security).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ [SWAGGER_BEARER_AUTH]: expect.any(Array) }),
    ]),
  );
}

describe('Settings module (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MYSQL_POOL)
      .useValue({
        query: jest.fn().mockResolvedValue([[{ 1: 1 }]]),
        end: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(CountriesService)
      .useValue(stubListService())
      .overrideProvider(CitiesService)
      .useValue(stubListService())
      .overrideProvider(CurrenciesService)
      .useValue(stubListService())
      .overrideProvider(ExchangeRatesService)
      .useValue(stubListService())
      .overrideProvider(TaxesService)
      .useValue(stubListService())
      .overrideProvider(UnitsService)
      .useValue(stubListService())
      .overrideProvider(PaymentTermsService)
      .useValue(stubListService())
      .overrideProvider(ShippingTermsService)
      .useValue(stubListService())
      .compile();

    app = moduleFixture.createNestApplication();
    const config = app.get(ConfigService<Env, true>);
    configureApp(app, config);
    setupSwagger(app, config.get('PORT', { infer: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('OpenAPI', () => {
    it('documents Settings tag and all resource paths with bearer security', async () => {
      const res = await request(app.getHttpServer())
        .get('/docs-json')
        .expect(200);

      const body = res.body as OpenApiDocument;

      expect(body.tags?.some((tag) => tag.name === 'Settings')).toBe(true);
      expect(body.paths['/api/v1/exchange-rates/latest']).toBeDefined();
      expectSettingsOperation(body.paths['/api/v1/exchange-rates/latest'], 'get');

      for (const resource of SETTINGS_CRUD_PATHS) {
        expectSettingsOperation(body.paths[resource.collection], 'get');
        expectSettingsOperation(body.paths[resource.collection], 'post');
        expectSettingsOperation(body.paths[resource.item], 'get');
        expectSettingsOperation(body.paths[resource.item], 'patch');
        expectSettingsOperation(body.paths[resource.item], 'delete');
      }
    });
  });

  describe('list endpoints (happy path)', () => {
    it.each([
      '/api/v1/countries',
      '/api/v1/cities',
      '/api/v1/currencies',
      '/api/v1/exchange-rates',
      '/api/v1/taxes',
      '/api/v1/units',
      '/api/v1/payment-terms',
      '/api/v1/shipping-terms',
    ])('%s returns paginated envelope', async (path) => {
      const res = await request(app.getHttpServer()).get(path).expect(200);

      expect(res.body).toEqual(emptyPage);
    });

    it('/api/v1/exchange-rates/latest is registered (service stub)', async () => {
      const exchangeRates = app.get(ExchangeRatesService) as {
        findLatest: jest.Mock;
      };
      exchangeRates.findLatest.mockResolvedValue({
        id: 'rate-1',
        fromCurrencyId: 'from',
        toCurrencyId: 'to',
        rate: '1.00000000',
        rateDate: '2026-09-04',
        source: null,
        createdAt: '2026-09-04 10:00:00.000',
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/exchange-rates/latest')
        .query({ from: 'USD', to: 'CDF' })
        .expect(200);

      expect(res.body.rate).toBe('1.00000000');
      expect(exchangeRates.findLatest).toHaveBeenCalled();
    });
  });
});
