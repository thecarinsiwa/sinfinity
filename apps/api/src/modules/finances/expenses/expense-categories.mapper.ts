import type {
  ExpenseCategoryResponseDto,
  ExpenseCategoryTreeNodeDto,
} from './dto/expense-category.dto';

export type ExpenseCategoryRow = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toExpenseCategoryResponse(
  row: ExpenseCategoryRow,
): ExpenseCategoryResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    parentId: row.parent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function buildExpenseCategoryTree(
  rows: ExpenseCategoryRow[],
): ExpenseCategoryTreeNodeDto[] {
  const byParent = new Map<string | null, ExpenseCategoryRow[]>();
  for (const row of rows) {
    const key = row.parent_id;
    const list = byParent.get(key) ?? [];
    list.push(row);
    byParent.set(key, list);
  }

  const sortRows = (list: ExpenseCategoryRow[]) =>
    [...list].sort((a, b) => a.code.localeCompare(b.code));

  const walk = (parentId: string | null): ExpenseCategoryTreeNodeDto[] =>
    sortRows(byParent.get(parentId) ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      children: walk(row.id),
    }));

  return walk(null);
}
