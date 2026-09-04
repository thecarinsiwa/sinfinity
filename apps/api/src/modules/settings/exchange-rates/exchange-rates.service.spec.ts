import { ConflictException, NotFoundException } from '@nestjs/common';
import { CurrenciesService } from '../currencies/currencies.service';
import { ExchangeRatesService } from './exchange-rates.service';

type Thenable<T> = PromiseLike<T> & Record<string, unknown>;

function thenable<T>(value: T): Thenable<T> {
  const chain: Thenable<T> = {
    then: (onFulfilled, onRejected) =>
      Promise.resolve(value).then(onFulfilled, onRejected),
  };
  const self = () => chain;
  chain.from = jest.fn(self);
  chain.where = jest.fn(self);
  chain.orderBy = jest.fn(self);
  chain.limit = jest.fn(self);
  chain.offset = jest.fn(self);
  chain.$dynamic = jest.fn(self);
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('ExchangeRatesService', () => {
  const rateRow = {
    id: '0191e6b8-4c3a-7b2d-9f1e-dddddddddddd',
    from_currency_id: 'from-id',
    to_currency_id: 'to-id',
    rate: '2850.50000000',
    rate_date: '2026-09-01',
    source: 'manual',
    created_at: '2026-09-04 10:00:00.000',
  };

  let service: ExchangeRatesService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
  };
  let currenciesService: { findIdByCode: jest.Mock };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn(),
    };
    currenciesService = {
      findIdByCode: jest.fn(),
    };
    service = new ExchangeRatesService(
      db as never,
      currenciesService as unknown as CurrenciesService,
    );
  });

  it('returns latest rate for pair', async () => {
    currenciesService.findIdByCode
      .mockResolvedValueOnce('from-id')
      .mockResolvedValueOnce('to-id');
    db.select.mockReturnValue(thenable([rateRow]));

    const result = await service.findLatest({
      from: 'USD',
      to: 'CDF',
      date: '2026-09-04',
    });

    expect(result.rate).toBe('2850.50000000');
    expect(typeof result.rate).toBe('string');
  });

  it('throws when no latest rate', async () => {
    currenciesService.findIdByCode
      .mockResolvedValueOnce('from-id')
      .mockResolvedValueOnce('to-id');
    db.select.mockReturnValue(thenable([]));

    await expect(
      service.findLatest({ from: 'USD', to: 'CDF' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps duplicate create to ConflictException', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: 'from-id' }]))
      .mockReturnValueOnce(thenable([{ id: 'to-id' }]));
    db.insert.mockReturnValue({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create({
        fromCurrencyId: 'from-id',
        toCurrencyId: 'to-id',
        rate: '1.0',
        rateDate: '2026-09-04',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
