import type {
  ProductCategoryResponseDto,
  ProductCategoryTreeNodeDto,
} from './dto/product-category-response.dto';

export type ProductCategoryRow = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toProductCategoryResponse(
  row: ProductCategoryRow,
): ProductCategoryResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function buildCategoryTree(
  rows: ProductCategoryRow[],
): ProductCategoryTreeNodeDto[] {
  const byParent = new Map<string | null, ProductCategoryRow[]>();
  for (const row of rows) {
    const key = row.parent_id;
    const list = byParent.get(key) ?? [];
    list.push(row);
    byParent.set(key, list);
  }

  const sortRows = (list: ProductCategoryRow[]) =>
    [...list].sort(
      (a, b) =>
        a.sort_order - b.sort_order || a.code.localeCompare(b.code),
    );

  const walk = (parentId: string | null): ProductCategoryTreeNodeDto[] =>
    sortRows(byParent.get(parentId) ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      sortOrder: row.sort_order,
      children: walk(row.id),
    }));

  return walk(null);
}
