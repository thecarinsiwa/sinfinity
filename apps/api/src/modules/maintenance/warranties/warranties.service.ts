import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, isNull, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  customers,
  products,
  sales_orders,
  serial_numbers,
  support_tickets,
  warranties,
  warranty_claims,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../maintenance-scope';
import {
  assertClaimTransition,
  CLAIM_STATUS,
  type ClaimStatus,
} from '../claim-statuses';
import {
  assertWarrantyTransition,
  WARRANTY_STATUS,
  WARRANTY_TYPE,
  type WarrantyType,
} from '../warranty-statuses';
import {
  CreateWarrantyClaimDto,
  CreateWarrantyDto,
  ListWarrantiesQueryDto,
  TransitionWarrantyClaimDto,
  TransitionWarrantyDto,
  UpdateWarrantyClaimDto,
  UpdateWarrantyDto,
  WarrantyClaimResponseDto,
  WarrantyResponseDto,
} from './dto/warranty.dto';
import {
  toWarrantyClaimResponse,
  toWarrantyResponse,
  type WarrantyClaimRow,
  type WarrantyRow,
} from './warranties.mapper';

function toDateOnly(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.slice(0, 10);
}

function toMysqlDateTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace('T', ' ').replace('Z', '').slice(0, 23);
}

@Injectable()
export class WarrantiesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListWarrantiesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<WarrantyResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      status,
      warrantyType,
      customerId,
      productId,
      serialNumberId,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [eq(warranties.organization_id, scopeOrgId)];
    if (status) parts.push(eq(warranties.status, status));
    if (warrantyType) parts.push(eq(warranties.warranty_type, warrantyType));
    if (customerId) parts.push(eq(warranties.customer_id, customerId));
    if (productId) parts.push(eq(warranties.product_id, productId));
    if (serialNumberId) {
      parts.push(eq(warranties.serial_number_id, serialNumberId));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(warranties).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(warranties)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(warranties.created_at), asc(warranties.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as WarrantyRow[]).map((row) => toWarrantyResponse(row)),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarrantyResponseDto> {
    const row = await this.requireWarrantyAccess(
      id,
      currentOrganizationId,
      user,
    );
    const claims = await this.loadClaims(id);
    return toWarrantyResponse(row, claims);
  }

  async create(
    dto: CreateWarrantyDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarrantyResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'warranty',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureCustomerInOrg(dto.customerId, organizationId);
    await this.ensureProductInOrg(dto.productId, organizationId);
    if (dto.serialNumberId) {
      await this.ensureSerialForProduct(
        dto.serialNumberId,
        organizationId,
        dto.productId,
      );
    }
    if (dto.salesOrderId) {
      await this.ensureSalesOrderLinkable(
        dto.salesOrderId,
        organizationId,
        dto.customerId,
      );
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(warranties).values({
        id,
        organization_id: organizationId,
        product_id: dto.productId,
        serial_number_id: dto.serialNumberId ?? null,
        customer_id: dto.customerId,
        sales_order_id: dto.salesOrderId ?? null,
        start_date: toDateOnly(dto.startDate)!,
        end_date: toDateOnly(dto.endDate),
        warranty_type: dto.warrantyType ?? WARRANTY_TYPE.SELLER,
        terms: dto.terms ?? null,
        status: WARRANTY_STATUS.ACTIVE,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid warranty reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateWarrantyDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarrantyResponseDto> {
    const existing = await this.requireWarrantyAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.status !== WARRANTY_STATUS.ACTIVE) {
      throw new BadRequestException(
        `Cannot update a warranty in status "${existing.status}"`,
      );
    }

    const customerId = dto.customerId ?? existing.customer_id;
    const productId = dto.productId ?? existing.product_id;
    if (!customerId || !productId) {
      throw new BadRequestException('customerId and productId are required');
    }

    if (dto.customerId) {
      await this.ensureCustomerInOrg(dto.customerId, existing.organization_id);
    }
    if (dto.productId) {
      await this.ensureProductInOrg(dto.productId, existing.organization_id);
    }
    const serialNumberId =
      dto.serialNumberId !== undefined
        ? dto.serialNumberId
        : existing.serial_number_id;
    if (serialNumberId) {
      await this.ensureSerialForProduct(
        serialNumberId,
        existing.organization_id,
        productId,
      );
    }
    if (dto.salesOrderId) {
      await this.ensureSalesOrderLinkable(
        dto.salesOrderId,
        existing.organization_id,
        customerId,
      );
    }

    const patch: Partial<{
      product_id: string;
      customer_id: string;
      serial_number_id: string | null;
      sales_order_id: string | null;
      start_date: string;
      end_date: string | null;
      warranty_type: WarrantyType;
      terms: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.productId !== undefined) patch.product_id = dto.productId;
    if (dto.customerId !== undefined) patch.customer_id = dto.customerId;
    if (dto.serialNumberId !== undefined) {
      patch.serial_number_id = dto.serialNumberId;
    }
    if (dto.salesOrderId !== undefined) {
      patch.sales_order_id = dto.salesOrderId;
    }
    if (dto.startDate !== undefined) {
      patch.start_date = toDateOnly(dto.startDate)!;
    }
    if (dto.endDate !== undefined) patch.end_date = toDateOnly(dto.endDate);
    if (dto.warrantyType !== undefined) {
      patch.warranty_type = dto.warrantyType;
    }
    if (dto.terms !== undefined) patch.terms = dto.terms;

    try {
      await this.db.update(warranties).set(patch).where(eq(warranties.id, id));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid warranty reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.requireWarrantyAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (
      existing.status !== WARRANTY_STATUS.VOID &&
      existing.status !== WARRANTY_STATUS.EXPIRED
    ) {
      throw new BadRequestException(
        'Only a void or expired warranty can be deleted',
      );
    }
    await this.db.delete(warranties).where(eq(warranties.id, id));
  }

  async transition(
    id: string,
    dto: TransitionWarrantyDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarrantyResponseDto> {
    const existing = await this.requireWarrantyAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertWarrantyTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    await this.db
      .update(warranties)
      .set({
        status: dto.toStatus,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(warranties.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  async listClaims(
    warrantyId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarrantyClaimResponseDto[]> {
    await this.requireWarrantyAccess(warrantyId, currentOrganizationId, user);
    const claims = await this.loadClaims(warrantyId);
    return claims.map(toWarrantyClaimResponse);
  }

  async findClaim(
    warrantyId: string,
    claimId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarrantyClaimResponseDto> {
    await this.requireWarrantyAccess(warrantyId, currentOrganizationId, user);
    return this.requireClaim(warrantyId, claimId);
  }

  async createClaim(
    warrantyId: string,
    dto: CreateWarrantyClaimDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarrantyClaimResponseDto> {
    const warranty = await this.requireWarrantyAccess(
      warrantyId,
      currentOrganizationId,
      user,
    );
    if (warranty.status !== WARRANTY_STATUS.ACTIVE) {
      throw new BadRequestException(
        'Claims can only be created on an active warranty',
      );
    }
    await this.ensureClaimNumberUnique(warrantyId, dto.claimNumber.trim());
    if (dto.ticketId) {
      await this.ensureTicketInOrg(dto.ticketId, warranty.organization_id);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(warranty_claims).values({
        id,
        warranty_id: warrantyId,
        ticket_id: dto.ticketId ?? null,
        claim_number: dto.claimNumber.trim(),
        description: dto.description ?? null,
        status: CLAIM_STATUS.SUBMITTED,
        resolution: null,
        claimed_at: toMysqlDateTime(dto.claimedAt) ?? now,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid warranty claim reference');
    }

    return this.requireClaim(warrantyId, id);
  }

  async updateClaim(
    warrantyId: string,
    claimId: string,
    dto: UpdateWarrantyClaimDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarrantyClaimResponseDto> {
    const warranty = await this.requireWarrantyAccess(
      warrantyId,
      currentOrganizationId,
      user,
    );
    const existing = await this.requireClaimRow(warrantyId, claimId);
    if (existing.status !== CLAIM_STATUS.SUBMITTED) {
      throw new BadRequestException('Only a submitted claim can be updated');
    }
    if (dto.ticketId) {
      await this.ensureTicketInOrg(dto.ticketId, warranty.organization_id);
    }

    const patch: Partial<{
      description: string | null;
      ticket_id: string | null;
      resolution: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.ticketId !== undefined) patch.ticket_id = dto.ticketId;
    if (dto.resolution !== undefined) patch.resolution = dto.resolution;

    try {
      await this.db
        .update(warranty_claims)
        .set(patch)
        .where(eq(warranty_claims.id, claimId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid warranty claim reference');
    }

    return this.requireClaim(warrantyId, claimId);
  }

  async removeClaim(
    warrantyId: string,
    claimId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireWarrantyAccess(warrantyId, currentOrganizationId, user);
    const existing = await this.requireClaimRow(warrantyId, claimId);
    if (existing.status !== CLAIM_STATUS.SUBMITTED) {
      throw new BadRequestException('Only a submitted claim can be deleted');
    }
    await this.db
      .delete(warranty_claims)
      .where(eq(warranty_claims.id, claimId));
  }

  async transitionClaim(
    warrantyId: string,
    claimId: string,
    dto: TransitionWarrantyClaimDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarrantyClaimResponseDto> {
    await this.requireWarrantyAccess(warrantyId, currentOrganizationId, user);
    const existing = await this.requireClaimRow(warrantyId, claimId);
    try {
      assertClaimTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    const patch: Partial<{
      status: ClaimStatus;
      resolution: string | null;
      updated_at: string;
    }> = {
      status: dto.toStatus,
      updated_at: nowMysqlDateTime(),
    };
    if (dto.resolution !== undefined) {
      patch.resolution = dto.resolution;
    }

    await this.db
      .update(warranty_claims)
      .set(patch)
      .where(eq(warranty_claims.id, claimId));

    return this.requireClaim(warrantyId, claimId);
  }

  private async loadClaims(warrantyId: string): Promise<WarrantyClaimRow[]> {
    const rows = await this.db
      .select()
      .from(warranty_claims)
      .where(eq(warranty_claims.warranty_id, warrantyId))
      .orderBy(asc(warranty_claims.claimed_at), asc(warranty_claims.id));
    return rows;
  }

  private async requireClaim(
    warrantyId: string,
    claimId: string,
  ): Promise<WarrantyClaimResponseDto> {
    const row = await this.requireClaimRow(warrantyId, claimId);
    return toWarrantyClaimResponse(row);
  }

  private async requireClaimRow(
    warrantyId: string,
    claimId: string,
  ): Promise<WarrantyClaimRow> {
    const [row] = await this.db
      .select()
      .from(warranty_claims)
      .where(
        and(
          eq(warranty_claims.id, claimId),
          eq(warranty_claims.warranty_id, warrantyId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Claim ${claimId} not found on warranty ${warrantyId}`,
      );
    }
    return row;
  }

  private async ensureClaimNumberUnique(
    warrantyId: string,
    claimNumber: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: warranty_claims.id })
      .from(warranty_claims)
      .where(
        and(
          eq(warranty_claims.warranty_id, warrantyId),
          eq(warranty_claims.claim_number, claimNumber),
        ),
      )
      .limit(1);
    if (row) {
      throw new ConflictException(
        'Claim number already exists for this warranty',
      );
    }
  }

  private async requireWarrantyAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarrantyRow> {
    const [row] = await this.db
      .select()
      .from(warranties)
      .where(eq(warranties.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Warranty ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'warranty',
    );
    return row;
  }

  private async ensureCustomerInOrg(
    customerId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: customers.id, organization_id: customers.organization_id })
      .from(customers)
      .where(and(eq(customers.id, customerId), isNull(customers.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Customer must belong to the same organization',
      );
    }
  }

  private async ensureProductInOrg(
    productId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: products.id, organization_id: products.organization_id })
      .from(products)
      .where(and(eq(products.id, productId), isNull(products.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Product must belong to the same organization',
      );
    }
  }

  private async ensureSerialForProduct(
    serialNumberId: string,
    organizationId: string,
    productId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: serial_numbers.id,
        organization_id: serial_numbers.organization_id,
        product_id: serial_numbers.product_id,
      })
      .from(serial_numbers)
      .where(eq(serial_numbers.id, serialNumberId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Serial number ${serialNumberId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Serial number must belong to the same organization',
      );
    }
    if (row.product_id !== productId) {
      throw new BadRequestException(
        'Serial number product must match the warranty product',
      );
    }
  }

  private async ensureSalesOrderLinkable(
    salesOrderId: string,
    organizationId: string,
    customerId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: sales_orders.id,
        organization_id: sales_orders.organization_id,
        customer_id: sales_orders.customer_id,
      })
      .from(sales_orders)
      .where(
        and(eq(sales_orders.id, salesOrderId), isNull(sales_orders.deleted_at)),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Sales order ${salesOrderId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Sales order must belong to the same organization',
      );
    }
    if (row.customer_id !== customerId) {
      throw new BadRequestException(
        'Sales order customer must match the warranty customer',
      );
    }
  }

  private async ensureTicketInOrg(
    ticketId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: support_tickets.id,
        organization_id: support_tickets.organization_id,
      })
      .from(support_tickets)
      .where(
        and(
          eq(support_tickets.id, ticketId),
          isNull(support_tickets.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Ticket must belong to the same organization',
      );
    }
  }
}
