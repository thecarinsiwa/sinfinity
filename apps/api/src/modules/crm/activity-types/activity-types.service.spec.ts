import { ActivityTypesService } from './activity-types.service';
import { SYSTEM_ACTIVITY_TYPES } from './activity-types.catalog';

type Thenable<T> = PromiseLike<T> & Record<string, unknown>;

function thenable<T>(value: T): Thenable<T> {
  const chain: Thenable<T> = {
    then: (onFulfilled, onRejected) =>
      Promise.resolve(value).then(onFulfilled, onRejected),
  } as Thenable<T>;
  const self = () => chain;
  chain.from = jest.fn(self);
  chain.where = jest.fn(self);
  chain.orderBy = jest.fn(self);
  chain.limit = jest.fn(self);
  chain.offset = jest.fn(self);
  chain.$dynamic = jest.fn(self);
  return chain;
}

describe('ActivityTypesService', () => {
  it('lists seeded activity type codes', async () => {
    const rows = SYSTEM_ACTIVITY_TYPES.map((def, index) => ({
      id: `id-${index}`,
      code: def.code,
      name: def.name,
      icon: def.icon,
      created_at: '2026-09-04 10:00:00.000',
      updated_at: '2026-09-04 10:00:00.000',
    }));

    const db = {
      select: jest
        .fn()
        .mockReturnValueOnce(thenable(rows))
        .mockReturnValueOnce(thenable([{ total: rows.length }])),
    };

    const service = new ActivityTypesService(db as never);
    const result = await service.findAll({ page: 1, pageSize: 20 });
    expect(result.data.map((row) => row.code)).toEqual([
      'CALL',
      'EMAIL',
      'MEETING',
      'VISIT',
    ]);
  });
});
