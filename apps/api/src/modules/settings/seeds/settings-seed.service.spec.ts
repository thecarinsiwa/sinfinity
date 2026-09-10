import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../../config/env.validation';
import { SettingsSeedController } from './settings-seed.controller';
import { SettingsSeedService } from './settings-seed.service';
import {
  SEED_COUNTRIES,
  SEED_CURRENCIES,
  SEED_UNITS,
} from './settings.catalog';

type Thenable<T> = PromiseLike<T> & Record<string, unknown>;

function thenable<T>(value: T): Thenable<T> {
  const chain: Thenable<T> = {
    then: (onFulfilled, onRejected) =>
      Promise.resolve(value).then(onFulfilled, onRejected),
  };
  const self = () => chain;
  chain.from = jest.fn(self);
  chain.where = jest.fn(self);
  chain.limit = jest.fn(self);
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('settings.catalog', () => {
  it('includes required currencies and countries', () => {
    expect(SEED_CURRENCIES.map((c) => c.code)).toEqual(
      expect.arrayContaining(['USD', 'CDF', 'CNY', 'EUR']),
    );
    expect(SEED_COUNTRIES.map((c) => c.code)).toEqual(
      expect.arrayContaining(['CD', 'CN', 'AE', 'FR', 'BE']),
    );
    expect(SEED_UNITS.map((u) => u.code)).toEqual(
      expect.arrayContaining(['PCS', 'KG', 'BOX', 'M']),
    );
  });
});

describe('SettingsSeedService', () => {
  it('inserts currencies when missing and updates when present', async () => {
    const select = jest
      .fn()
      // currencies: all missing
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      // countries: all missing
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      // cities: country lookups + city missing (4 cities)
      .mockReturnValueOnce(thenable([{ id: 'cd' }]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([{ id: 'cd' }]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([{ id: 'cn' }]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([{ id: 'ae' }]))
      .mockReturnValueOnce(thenable([]))
      // units: all missing
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      // shipping: all missing (5)
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      // payment terms: all missing (3)
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      // taxes: country + missing
      .mockReturnValueOnce(thenable([{ id: 'cd' }]))
      .mockReturnValueOnce(thenable([]));

    const insert = jest.fn().mockReturnValue(thenable(undefined));
    const update = jest.fn().mockReturnValue(thenable(undefined));
    const service = new SettingsSeedService({
      select,
      insert,
      update,
    } as never);

    const result = await service.seed();

    expect(result.inserted).toBeGreaterThan(0);
    expect(result.details.currencies.inserted).toBe(4);
    expect(result.details.countries.inserted).toBe(5);
    expect(result.details.taxes.inserted).toBe(1);
    expect(insert).toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('updates existing currency by code', async () => {
    const select = jest.fn().mockReturnValue(thenable([{ id: 'existing' }]));
    const insert = jest.fn().mockReturnValue(thenable(undefined));
    const update = jest.fn().mockReturnValue(thenable(undefined));
    const service = new SettingsSeedService({
      select,
      insert,
      update,
    } as never);

    // Only exercise currencies via private path by running full seed with
    // every lookup returning existing — cities need country id then city id.
    select.mockReset();
    const queue: unknown[] = [];
    for (let i = 0; i < 4; i++) queue.push([{ id: `cur-${i}` }]);
    for (let i = 0; i < 5; i++) queue.push([{ id: `co-${i}` }]);
    for (let i = 0; i < 4; i++) {
      queue.push([{ id: `country-${i}` }]);
      queue.push([{ id: `city-${i}` }]);
    }
    for (let i = 0; i < 4; i++) queue.push([{ id: `u-${i}` }]);
    for (let i = 0; i < 5; i++) queue.push([{ id: `st-${i}` }]);
    for (let i = 0; i < 3; i++) queue.push([{ id: `pt-${i}` }]);
    queue.push([{ id: 'cd' }]);
    queue.push([{ id: 'tax-1' }]);

    for (const row of queue) {
      select.mockReturnValueOnce(thenable(row as never));
    }

    const result = await service.seed();
    expect(result.updated).toBeGreaterThan(0);
    expect(result.inserted).toBe(0);
    expect(update).toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });
});

describe('SettingsSeedController', () => {
  it('rejects outside development', async () => {
    const seed = jest.fn();
    const config = {
      get: jest.fn().mockReturnValue('production'),
    } as unknown as ConfigService<Env, true>;
    const controller = new SettingsSeedController(
      { seed } as unknown as SettingsSeedService,
      config,
    );

    await expect(controller.seed()).rejects.toBeInstanceOf(ForbiddenException);
    expect(seed).not.toHaveBeenCalled();
  });

  it('delegates to service in development', async () => {
    const seedResult = {
      inserted: 1,
      updated: 0,
      details: {} as never,
    };
    const seed = jest.fn().mockResolvedValue(seedResult);
    const config = {
      get: jest.fn().mockReturnValue('development'),
    } as unknown as ConfigService<Env, true>;
    const controller = new SettingsSeedController(
      { seed } as unknown as SettingsSeedService,
      config,
    );

    await expect(controller.seed()).resolves.toBe(seedResult);
    expect(seed).toHaveBeenCalled();
  });
});
