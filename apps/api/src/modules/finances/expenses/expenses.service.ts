import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  isNull,
  like,
  type SQL,
} from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  currencies,
  expense_categories,
  expenses,
  landed_costs,
  suppliers,
  users,
} from '../../../database/schema';
import { formatDecimal } from '../../sales-orders/sales-orders-totals';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../finances-scope';
import {
  assertExpenseTransition,
  EXPENSE_STATUS,
} from '../expense-statuses';
import {
  CreateExpenseDto,
  ExpenseResponseDto,
  ListExpensesQueryDto,
  TransitionExpenseDto,
  UpdateExpenseDto,
} from './dto/expense.dto';
import { toExpenseResponse, type ExpenseRow } from './expenses.mapper';

function toDateOnly(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.slice(0, 10);
}

@Injectable()
export class ExpensesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListExpensesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<ExpenseResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      search,
      status,
      categoryId,
      supplierId,
      landedCostId,
      includeDeleted,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [eq(expenses.organization_id, scopeOrgId)];
    if (!includeDeleted) {
      parts.push(isNull(expenses.deleted_at));
    }
    if (search?.trim()) {
      parts.push(like(expenses.title, `%${search.trim()}%`));
    }
    if (status) parts.push(eq(expenses.status, status));
    if (categoryId) parts.push(eq(expenses.category_id, categoryId));
    if (supplierId) parts.push(eq(expenses.supplier_id, supplierId));
    if (landedCostId) {
      parts.push(eq(expenses.landed_cost_id, landedCostId));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(expenses).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(expenses)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(expenses.expense_date), asc(expenses.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ExpenseRow[]).map(toExpenseResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ExpenseResponseDto> {
    const row = await this.requireExpenseAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toExpenseResponse(row);
  }

  async create(
    dto: CreateExpenseDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ExpenseResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'expense',
    );
    await ensureOrganizationExists(this.db, organizationId);
    if (dto.categoryId) {
      await this.ensureCategoryInOrg(dto.categoryId, organizationId);
    }
    if (dto.currencyId) {
      await this.ensureCurrencyExists(dto.currencyId);
    }
    if (dto.supplierId) {
      await this.ensureSupplierInOrg(dto.supplierId, organizationId);
    }
    if (dto.landedCostId) {
      await this.ensureLandedCostInOrg(dto.landedCostId, organizationId);
    }
    const paidBy = dto.paidBy ?? user?.id ?? null;
    if (paidBy) {
      await this.ensureUserInOrg(paidBy, organizationId);
    }

    const amount = formatDecimal(Number(dto.amount));
    if (Number(amount) < 0) {
      throw new BadRequestException('amount cannot be negative');
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(expenses).values({
        id,
        organization_id: organizationId,
        category_id: dto.categoryId ?? null,
        title: dto.title.trim(),
        amount,
        currency_id: dto.currencyId ?? null,
        expense_date: toDateOnly(dto.expenseDate)!,
        supplier_id: dto.supplierId ?? null,
        landed_cost_id: dto.landedCostId ?? null,
        paid_by: paidBy,
        status: EXPENSE_STATUS.DRAFT,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid expense reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateExpenseDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ExpenseResponseDto> {
    const existing = await this.requireExpenseAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.status !== EXPENSE_STATUS.DRAFT) {
      throw new BadRequestException(
        'Expense can only be updated while status is draft',
      );
    }

    if (dto.categoryId) {
      await this.ensureCategoryInOrg(
        dto.categoryId,
        existing.organization_id,
      );
    }
    if (dto.currencyId) {
      await this.ensureCurrencyExists(dto.currencyId);
    }
    if (dto.supplierId) {
      await this.ensureSupplierInOrg(
        dto.supplierId,
        existing.organization_id,
      );
    }
    if (dto.landedCostId) {
      await this.ensureLandedCostInOrg(
        dto.landedCostId,
        existing.organization_id,
      );
    }
    if (dto.paidBy) {
      await this.ensureUserInOrg(dto.paidBy, existing.organization_id);
    }

    const patch: Partial<{
      category_id: string | null;
      title: string;
      amount: string;
      currency_id: string | null;
      expense_date: string;
      supplier_id: string | null;
      landed_cost_id: string | null;
      paid_by: string | null;
      updated_at: string;
    }> = {
      updated_at: nowMysqlDateTime(),
    };

    if (dto.categoryId !== undefined) patch.category_id = dto.categoryId;
    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.amount !== undefined) {
      const amount = formatDecimal(Number(dto.amount));
      if (Number(amount) < 0) {
        throw new BadRequestException('amount cannot be negative');
      }
      patch.amount = amount;
    }
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.expenseDate !== undefined) {
      patch.expense_date = toDateOnly(dto.expenseDate)!;
    }
    if (dto.supplierId !== undefined) patch.supplier_id = dto.supplierId;
    if (dto.landedCostId !== undefined) {
      patch.landed_cost_id = dto.landedCostId;
    }
    if (dto.paidBy !== undefined) patch.paid_by = dto.paidBy;

    try {
      await this.db.update(expenses).set(patch).where(eq(expenses.id, id));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid expense reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.requireExpenseAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (
      existing.status !== EXPENSE_STATUS.DRAFT &&
      existing.status !== EXPENSE_STATUS.REJECTED
    ) {
      throw new BadRequestException(
        'Only draft or rejected expenses can be deleted',
      );
    }
    await this.db
      .update(expenses)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(expenses.id, id));
  }

  async transition(
    id: string,
    dto: TransitionExpenseDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ExpenseResponseDto> {
    const existing = await this.requireExpenseAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertExpenseTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    await this.db
      .update(expenses)
      .set({
        status: dto.toStatus,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(expenses.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  private async requireExpenseAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ExpenseRow> {
    const [row] = await this.db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Expense ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'expense',
    );
    return row as ExpenseRow;
  }

  private async ensureCategoryInOrg(
    categoryId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: expense_categories.id,
        organization_id: expense_categories.organization_id,
      })
      .from(expense_categories)
      .where(
        and(
          eq(expense_categories.id, categoryId),
          isNull(expense_categories.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Expense category ${categoryId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Category must belong to the same organization',
      );
    }
  }

  private async ensureSupplierInOrg(
    supplierId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: suppliers.id, organization_id: suppliers.organization_id })
      .from(suppliers)
      .where(and(eq(suppliers.id, supplierId), isNull(suppliers.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Supplier must belong to the same organization',
      );
    }
  }

  private async ensureLandedCostInOrg(
    landedCostId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: landed_costs.id,
        organization_id: landed_costs.organization_id,
      })
      .from(landed_costs)
      .where(
        and(
          eq(landed_costs.id, landedCostId),
          isNull(landed_costs.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Landed cost ${landedCostId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Landed cost must belong to the same organization',
      );
    }
  }

  private async ensureUserInOrg(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: users.id, organization_id: users.organization_id })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'paidBy user must belong to the same organization',
      );
    }
  }

  private async ensureCurrencyExists(currencyId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.id, currencyId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Currency ${currencyId} not found`);
    }
  }
}
