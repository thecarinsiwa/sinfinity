import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, eq, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { payment_methods } from '../../../database/schema';
import {
  isMysqlDuplicateError,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import {
  fromBool,
  nowMysqlDateTime,
} from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../finances-scope';
import {
  CreatePaymentMethodDto,
  ListPaymentMethodsQueryDto,
  PaymentMethodResponseDto,
  UpdatePaymentMethodDto,
} from './dto/payment-method.dto';
import {
  toPaymentMethodResponse,
  type PaymentMethodRow,
} from './payment-methods.mapper';

@Injectable()
export class PaymentMethodsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListPaymentMethodsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<PaymentMethodResponseDto>> {
    const { page, pageSize, organizationId, search, isActive } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [eq(payment_methods.organization_id, scopeOrgId)];
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      parts.push(
        or(
          like(payment_methods.code, term),
          like(payment_methods.name, term),
        )!,
      );
    }
    if (isActive !== undefined) {
      parts.push(eq(payment_methods.is_active, fromBool(isActive)));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(payment_methods).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(payment_methods)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(payment_methods.code), asc(payment_methods.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as PaymentMethodRow[]).map(toPaymentMethodResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaymentMethodResponseDto> {
    const row = await this.requireMethodAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toPaymentMethodResponse(row);
  }

  async create(
    dto: CreatePaymentMethodDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaymentMethodResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'payment method',
    );
    await ensureOrganizationExists(this.db, organizationId);

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(payment_methods).values({
        id,
        organization_id: organizationId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        is_active: fromBool(dto.isActive ?? true),
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          `Payment method code "${dto.code.trim().toUpperCase()}" already exists in this organization`,
        );
      }
      throwFkOrRethrow(error, 'Invalid payment method reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdatePaymentMethodDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaymentMethodResponseDto> {
    await this.requireMethodAccess(id, currentOrganizationId, user);

    const patch: Partial<{
      code: string;
      name: string;
      is_active: number;
      updated_at: string;
    }> = {
      updated_at: nowMysqlDateTime(),
    };
    if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.isActive !== undefined) patch.is_active = fromBool(dto.isActive);

    try {
      await this.db
        .update(payment_methods)
        .set(patch)
        .where(eq(payment_methods.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          'Payment method code already exists in this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid payment method reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  /** Soft rule: deactivate instead of hard delete. */
  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.requireMethodAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.is_active === 0) {
      throw new BadRequestException('Payment method is already inactive');
    }
    await this.db
      .update(payment_methods)
      .set({
        is_active: 0,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(payment_methods.id, id));
  }

  private async requireMethodAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaymentMethodRow> {
    const [row] = await this.db
      .select()
      .from(payment_methods)
      .where(eq(payment_methods.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Payment method ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'payment method',
    );
    return row as PaymentMethodRow;
  }
}
