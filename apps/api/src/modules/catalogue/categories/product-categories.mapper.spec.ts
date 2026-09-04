import { buildCategoryTree } from './product-categories.mapper';

describe('product-categories.mapper', () => {
  it('builds a sorted tree from flat rows', () => {
    const tree = buildCategoryTree([
      {
        id: 'child-b',
        organization_id: 'org',
        code: 'NET',
        name: 'Réseaux',
        parent_id: 'root',
        sort_order: 2,
        created_at: 't',
        updated_at: 't',
        deleted_at: null,
      },
      {
        id: 'root',
        organization_id: 'org',
        code: 'IT',
        name: 'Informatique',
        parent_id: null,
        sort_order: 0,
        created_at: 't',
        updated_at: 't',
        deleted_at: null,
      },
      {
        id: 'child-a',
        organization_id: 'org',
        code: 'PC',
        name: 'PC',
        parent_id: 'root',
        sort_order: 1,
        created_at: 't',
        updated_at: 't',
        deleted_at: null,
      },
    ]);

    expect(tree).toHaveLength(1);
    expect(tree[0].code).toBe('IT');
    expect(tree[0].children.map((c) => c.code)).toEqual(['PC', 'NET']);
  });
});
