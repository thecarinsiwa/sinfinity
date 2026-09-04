import { buildPaginatedResponse } from './paginated-response.dto';

describe('buildPaginatedResponse', () => {
  it('builds data and meta', () => {
    const result = buildPaginatedResponse(['a', 'b'], 42, 2, 20);

    expect(result).toEqual({
      data: ['a', 'b'],
      meta: {
        page: 2,
        pageSize: 20,
        total: 42,
        totalPages: 3,
      },
    });
  });

  it('returns zero totalPages when pageSize is 0', () => {
    const result = buildPaginatedResponse([], 10, 1, 0);
    expect(result.meta.totalPages).toBe(0);
  });

  it('returns zero totalPages when total is 0', () => {
    const result = buildPaginatedResponse([], 0, 1, 20);
    expect(result.meta.totalPages).toBe(0);
  });
});
