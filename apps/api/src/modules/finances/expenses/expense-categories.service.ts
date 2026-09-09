import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, eq, isNull, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { expense_categories } from '../../../database/schema';
import {
  isMysqlDuplicateError,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../finances-scope';
import {
  CreateExpenseCategoryDto,
  ExpenseCategoryResponseDto,
  ExpenseCategoryTreeNodeDto,
  ListExpenseCategoriesQueryDto,
  UpdateExpenseCategoryDto,
} from './dto/expense-category.dto';
import {
  buildExpenseCategoryTree,
  toExpenseCategoryResponse,
  type ExpenseCategoryRow,
} from './expense-categories.mapper';

@Injectable()
export class ExpenseCategoriesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListExpenseCategoriesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<ExpenseCategoryResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      search,
      parentId,
      includeDeleted,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [
      eq(expense_categories.organization_id, scopeOrgId),
    ];
    if (!includeDeleted) {
      parts.push(isNull(expense_categories.deleted_at));
    }
    if (parentId) {
      parts.push(eq(expense_categories.parent_id, parentId));
    }
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      parts.push(
        or(
          like(expense_categories.code, term),
          like(expense_categories.name, term),
        )!,
      );
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(expense_categories).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(expense_categories)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(expense_categories.code), asc(expense_categories.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ExpenseCategoryRow[]).map(toExpenseCategoryResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findTree(
    organizationIdQuery: string | undefined,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ExpenseCategoryTreeNodeDto[]> {
    const scopeOrgId = requireScopeOrgId(
      organizationIdQuery,
      currentOrganizationId,
      user,
    );
    const rows = await this.db
      .select()
      .from(expense_categories)
      .where(
        and(
          eq(expense_categories.organization_id, scopeOrgId),
          isNull(expense_categories.deleted_at),
        ),
      )
      .orderBy(asc(expense_categories.code), asc(expense_categories.id));

    return buildExpenseCategoryTree(rows as ExpenseCategoryRow[]);
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ExpenseCategoryResponseDto> {
    const row = await this.requireCategoryAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toExpenseCategoryResponse(row);
  }

  async create(
    dto: CreateExpenseCategoryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ExpenseCategoryResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'expense category',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.assertParent(dto.parentId, organizationId, undefined);

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(expense_categories).values({
        id,
        organization_id: organizationId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        parent_id: dto.parentId ?? null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          `Expense category code "${dto.code.trim().toUpperCase()}" already exists in this organization`,
        );
      }
      throwFkOrRethrow(error, 'Invalid expense category reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateExpenseCategoryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ExpenseCategoryResponseDto> {
    const existing = await this.requireCategoryAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (dto.parentId !== undefined) {
      await this.assertParent(
        dto.parentId,
        existing.organization_id,
        id,
      );
    }

    const patch: Partial<{
      code: string;
      name: string;
      parent_id: string | null;
      updated_at: string;
    }> = {
      updated_at: nowMysqlDateTime(),
    };
    if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.parentId !== undefined) patch.parent_id = dto.parentId;

    try {
      await this.db
        .update(expense_categories)
        .set(patch)
        .where(eq(expense_categories.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          'Expense category code already exists in this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid expense category reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireCategoryAccess(id, currentOrganizationId, user);

    const [child] = await this.db
      .select({ id: expense_categories.id })
      .from(expense_categories)
      .where(
        and(
          eq(expense_categories.parent_id, id),
          isNull(expense_categories.deleted_at),
        ),
      )
      .limit(1);
    if (child) {
      throw new BadRequestException(
        'Cannot delete a category that still has active children',
      );
    }

    await this.db
      .update(expense_categories)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(expense_categories.id, id));
  }

  private async assertParent(
    parentId: string | null | undefined,
    organizationId: string,
    selfId: string | undefined,
  ): Promise<void> {
    if (!parentId) return;
    if (selfId && parentId === selfId) {
      throw new BadRequestException('Category cannot be its own parent');
    }
    const parent = await this.findActiveRowById(parentId);
    if (parent.organization_id !== organizationId) {
      throw new BadRequestException(
        'parentId must belong to the same organization',
      );
    }
    if (selfId) {
      await this.assertNotDescendant(selfId, parentId, organizationId);
    }
  }

  private async assertNotDescendant(
    selfId: string,
    parentId: string,
    organizationId: string,
  ): Promise<void> {
    const rows = await this.db
      .select({
        id: expense_categories.id,
        parent_id: expense_categories.parent_id,
      })
      .from(expense_categories)
      .where(
        and(
          eq(expense_categories.organization_id, organizationId),
          isNull(expense_categories.deleted_at),
        ),
      );

    const parentById = new Map(
      rows.map((r) => [r.id, r.parent_id as string | null]),
    );
    let cursor: string | null = parentId;
    const seen = new Set<string>();
    while (cursor) {
      if (cursor === selfId) {
        throw new BadRequestException(
          'parentId would create a cycle in the category tree',
        );
      }
      if (seen.has(cursor)) break;
      seen.add(cursor);
      cursor = parentById.get(cursor) ?? null;
    }
  }

  private async findActiveRowById(id: string): Promise<ExpenseCategoryRow> {
    const [row] = await this.db
      .select()
      .from(expense_categories)
      .where(
        and(
          eq(expense_categories.id, id),
          isNull(expense_categories.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Expense category ${id} not found`);
    }
    return row as ExpenseCategoryRow;
  }

  private async requireCategoryAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ExpenseCategoryRow> {
    const [row] = await this.db
      .select()
      .from(expense_categories)
      .where(eq(expense_categories.id, id))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Expense category ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'expense category',
    );
    return row as ExpenseCategoryRow;
  }
}
