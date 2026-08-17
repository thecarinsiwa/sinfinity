import * as schema from './index';

describe('Drizzle schema', () => {
  it('exports the introspected business tables', () => {
    expect(schema.organizations).toBeDefined();
    expect(schema.users).toBeDefined();
    expect(schema.currencies).toBeDefined();
    expect(schema.quotations).toBeDefined();
    expect(schema.purchase_orders).toBeDefined();
    expect(schema.inventory).toBeDefined();
  });

  it('keeps snake_case table identifiers matching the DDL', () => {
    expect(schema.sales_orders).toBeDefined();
    expect(schema.landed_costs).toBeDefined();
    expect((schema as Record<string, unknown>).salesOrders).toBeUndefined();
  });
});
