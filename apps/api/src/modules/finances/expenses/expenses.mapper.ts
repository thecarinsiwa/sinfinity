import type { ExpenseStatus } from '../expense-statuses';
import type { ExpenseResponseDto } from './dto/expense.dto';

export type ExpenseRow = {
  id: string;
  organization_id: string;
  category_id: string | null;
  title: string;
  amount: string;
  currency_id: string | null;
  expense_date: string;
  supplier_id: string | null;
  landed_cost_id: string | null;
  paid_by: string | null;
  status: ExpenseStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function toDateOnly(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.slice(0, 10);
}

export function toExpenseResponse(row: ExpenseRow): ExpenseResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    categoryId: row.category_id,
    title: row.title,
    amount: row.amount,
    currencyId: row.currency_id,
    expenseDate: toDateOnly(row.expense_date)!,
    supplierId: row.supplier_id,
    landedCostId: row.landed_cost_id,
    paidBy: row.paid_by,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}
