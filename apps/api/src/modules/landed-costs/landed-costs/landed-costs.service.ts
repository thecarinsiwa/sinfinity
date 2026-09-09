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
  landed_cost_items,
  landed_costs,
  products,
  purchase_order_items,
  purchase_orders,
  shipments,
} from '../../../database/schema';
import {
  isMysqlDuplicateError,
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../landed-costs-scope';
import { formatDecimal, sumDecimals } from '../landed-costs-totals';
import { CreateLandedCostDto } from './dto/create-landed-cost.dto';
import {
  CreateLandedCostItemDto,
  LandedCostItemResponseDto,
  UpdateLandedCostItemDto,
} from './dto/landed-cost-item.dto';
import { LandedCostResponseDto } from './dto/landed-cost-response.dto';
import { ListLandedCostsQueryDto } from './dto/list-landed-costs-query.dto';
import { UpdateLandedCostDto } from './dto/update-landed-cost.dto';
import {
  LANDED_COST_STATUS,
  type LandedCostStatus,
} from './landed-cost-statuses';
import {
  toLandedCostItemResponse,
  toLandedCostResponse,
  type LandedCostItemRow,
  type LandedCostRow,
} from './landed-costs.mapper';

@Injectable()
export class LandedCostsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListLandedCostsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<LandedCostResponseDto>> {
    const {
      page,
      pageSize,
      search,
      organizationId,
      status,
      purchaseOrderId,
      shipmentId,
      currencyId,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      status,
      purchaseOrderId,
      shipmentId,
      currencyId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(landed_costs).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(landed_costs)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(landed_costs.created_at), asc(landed_costs.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as LandedCostRow[]).map((row) => toLandedCostResponse(row)),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LandedCostResponseDto> {
    const row = await this.requireLandedCostAccess(
      id,
      currentOrganizationId,
      user,
    );
    const items = await this.loadItems(id);
    return toLandedCostResponse(
      row,
      items.map(toLandedCostItemResponse),
    );
  }

  async create(
    dto: CreateLandedCostDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LandedCostResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'landed cost',
    );
    await ensureOrganizationExists(this.db, organizationId);

    const purchaseOrderId = dto.purchaseOrderId ?? null;
    const shipmentId = dto.shipmentId ?? null;
    this.assertHasPoOrShipment(purchaseOrderId, shipmentId);

    if (purchaseOrderId) {
      await this.ensurePurchaseOrderInOrg(purchaseOrderId, organizationId);
    }
    if (shipmentId) {
      await this.ensureShipmentInOrg(shipmentId, organizationId);
    }

    const id = createId();
    const now = nowMysqlDateTime();

    try {
      await this.db.insert(landed_costs).values({
        id,
        organization_id: organizationId,
        reference: dto.reference.trim(),
        purchase_order_id: purchaseOrderId,
        shipment_id: shipmentId,
        currency_id: dto.currencyId ?? null,
        goods_cost: '0.0000',
        total_additional_costs: '0.0000',
        total_landed_cost: '0.0000',
        status: LANDED_COST_STATUS.DRAFT,
        calculated_at: null,
        calculated_by: null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Landed cost reference already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid purchase order, shipment or currency reference',
      );
    }

    if (dto.items?.length) {
      for (const item of dto.items) {
        await this.insertItem(id, organizationId, purchaseOrderId, item);
      }
      await this.recalculateGoodsCost(id, { resetAllocation: false });
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateLandedCostDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LandedCostResponseDto> {
    const existing = await this.requireLandedCostAccess(
      id,
      currentOrganizationId,
      user,
    );
    this.assertMutable(existing.status);

    const nextPoId =
      dto.purchaseOrderId !== undefined
        ? dto.purchaseOrderId
        : existing.purchase_order_id;
    const nextShipmentId =
      dto.shipmentId !== undefined ? dto.shipmentId : existing.shipment_id;
    this.assertHasPoOrShipment(nextPoId, nextShipmentId);

    if (dto.purchaseOrderId !== undefined && dto.purchaseOrderId != null) {
      await this.ensurePurchaseOrderInOrg(
        dto.purchaseOrderId,
        existing.organization_id,
      );
    }
    if (dto.shipmentId !== undefined && dto.shipmentId != null) {
      await this.ensureShipmentInOrg(
        dto.shipmentId,
        existing.organization_id,
      );
    }

    const patch: Partial<{
      reference: string;
      purchase_order_id: string | null;
      shipment_id: string | null;
      currency_id: string | null;
      status: LandedCostStatus;
      calculated_at: string | null;
      calculated_by: string | null;
      updated_at: string;
    }> = {
      updated_at: nowMysqlDateTime(),
      status: LANDED_COST_STATUS.DRAFT,
      calculated_at: null,
      calculated_by: null,
    };

    if (dto.reference !== undefined) patch.reference = dto.reference.trim();
    if (dto.purchaseOrderId !== undefined)
      patch.purchase_order_id = dto.purchaseOrderId;
    if (dto.shipmentId !== undefined) patch.shipment_id = dto.shipmentId;
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;

    try {
      await this.db
        .update(landed_costs)
        .set(patch)
        .where(eq(landed_costs.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Landed cost reference already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid purchase order, shipment or currency reference',
      );
    }

    await this.clearItemAllocations(id);
    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.requireLandedCostAccess(
      id,
      currentOrganizationId,
      user,
    );
    this.assertMutable(existing.status);
    await this.db
      .update(landed_costs)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(landed_costs.id, id));
  }

  async listItems(
    landedCostId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LandedCostItemResponseDto[]> {
    await this.requireLandedCostAccess(
      landedCostId,
      currentOrganizationId,
      user,
    );
    const rows = await this.loadItems(landedCostId);
    return rows.map(toLandedCostItemResponse);
  }

  async addItem(
    landedCostId: string,
    dto: CreateLandedCostItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LandedCostItemResponseDto> {
    const header = await this.requireLandedCostAccess(
      landedCostId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(header.status);
    const itemId = await this.insertItem(
      landedCostId,
      header.organization_id,
      header.purchase_order_id,
      dto,
    );
    await this.recalculateGoodsCost(landedCostId, { resetAllocation: true });
    return this.findItem(landedCostId, itemId);
  }

  async updateItem(
    landedCostId: string,
    itemId: string,
    dto: UpdateLandedCostItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LandedCostItemResponseDto> {
    const header = await this.requireLandedCostAccess(
      landedCostId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(header.status);
    await this.requireItem(landedCostId, itemId);

    if (dto.productId !== undefined && dto.productId != null) {
      await this.ensureProductInOrg(dto.productId, header.organization_id);
    }
    if (
      dto.purchaseOrderItemId !== undefined &&
      dto.purchaseOrderItemId != null
    ) {
      await this.ensurePoItemForHeader(
        dto.purchaseOrderItemId,
        header.purchase_order_id,
      );
    }

    const patch: Partial<{
      product_id: string | null;
      purchase_order_item_id: string | null;
      quantity: string;
      goods_cost: string;
      allocated_costs: string;
      unit_landed_cost: string;
      total_landed_cost: string;
      updated_at: string;
    }> = {
      allocated_costs: '0.0000',
      unit_landed_cost: '0.0000',
      total_landed_cost: '0.0000',
      updated_at: nowMysqlDateTime(),
    };

    if (dto.productId !== undefined) patch.product_id = dto.productId;
    if (dto.purchaseOrderItemId !== undefined)
      patch.purchase_order_item_id = dto.purchaseOrderItemId;
    if (dto.quantity !== undefined)
      patch.quantity = formatDecimal(Number(dto.quantity));
    if (dto.goodsCost !== undefined)
      patch.goods_cost = formatDecimal(Number(dto.goodsCost));

    try {
      await this.db
        .update(landed_cost_items)
        .set(patch)
        .where(eq(landed_cost_items.id, itemId));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid product or purchase order item reference',
      );
    }

    await this.recalculateGoodsCost(landedCostId, { resetAllocation: true });
    return this.findItem(landedCostId, itemId);
  }

  async removeItem(
    landedCostId: string,
    itemId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const header = await this.requireLandedCostAccess(
      landedCostId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(header.status);
    await this.requireItem(landedCostId, itemId);
    await this.db
      .delete(landed_cost_items)
      .where(eq(landed_cost_items.id, itemId));
    await this.recalculateGoodsCost(landedCostId, { resetAllocation: true });
  }

  private async insertItem(
    landedCostId: string,
    organizationId: string,
    purchaseOrderId: string | null,
    dto: CreateLandedCostItemDto,
  ): Promise<string> {
    if (dto.productId) {
      await this.ensureProductInOrg(dto.productId, organizationId);
    }
    if (dto.purchaseOrderItemId) {
      await this.ensurePoItemForHeader(
        dto.purchaseOrderItemId,
        purchaseOrderId,
      );
    }

    const quantity = formatDecimal(Number(dto.quantity ?? '1'));
    const goodsCost = formatDecimal(Number(dto.goodsCost ?? '0'));
    const id = createId();
    const now = nowMysqlDateTime();

    try {
      await this.db.insert(landed_cost_items).values({
        id,
        landed_cost_id: landedCostId,
        product_id: dto.productId ?? null,
        purchase_order_item_id: dto.purchaseOrderItemId ?? null,
        quantity,
        goods_cost: goodsCost,
        allocated_costs: '0.0000',
        unit_landed_cost: '0.0000',
        total_landed_cost: '0.0000',
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid product or purchase order item reference',
      );
    }
    return id;
  }

  private async recalculateGoodsCost(
    landedCostId: string,
    options: { resetAllocation: boolean },
  ): Promise<void> {
    const items = await this.loadItems(landedCostId);
    const goodsCost = sumDecimals(items.map((item) => item.goods_cost));
    const [header] = await this.db
      .select({
        total_additional_costs: landed_costs.total_additional_costs,
      })
      .from(landed_costs)
      .where(eq(landed_costs.id, landedCostId))
      .limit(1);
    const additional = header?.total_additional_costs ?? '0.0000';
    const totalLanded = sumDecimals([goodsCost, additional]);

    const patch: Partial<{
      goods_cost: string;
      total_landed_cost: string;
      status: LandedCostStatus;
      calculated_at: string | null;
      calculated_by: string | null;
      updated_at: string;
    }> = {
      goods_cost: goodsCost,
      total_landed_cost: totalLanded,
      updated_at: nowMysqlDateTime(),
    };

    if (options.resetAllocation) {
      patch.status = LANDED_COST_STATUS.DRAFT;
      patch.calculated_at = null;
      patch.calculated_by = null;
      await this.clearItemAllocations(landedCostId);
    }

    await this.db
      .update(landed_costs)
      .set(patch)
      .where(eq(landed_costs.id, landedCostId));
  }

  private async clearItemAllocations(landedCostId: string): Promise<void> {
    const now = nowMysqlDateTime();
    await this.db
      .update(landed_cost_items)
      .set({
        allocated_costs: '0.0000',
        unit_landed_cost: '0.0000',
        total_landed_cost: '0.0000',
        updated_at: now,
      })
      .where(eq(landed_cost_items.landed_cost_id, landedCostId));
  }

  private async loadItems(landedCostId: string): Promise<LandedCostItemRow[]> {
    const rows = await this.db
      .select()
      .from(landed_cost_items)
      .where(eq(landed_cost_items.landed_cost_id, landedCostId))
      .orderBy(asc(landed_cost_items.created_at), asc(landed_cost_items.id));
    return rows as LandedCostItemRow[];
  }

  private async findItem(
    landedCostId: string,
    itemId: string,
  ): Promise<LandedCostItemResponseDto> {
    const row = await this.requireItem(landedCostId, itemId);
    return toLandedCostItemResponse(row);
  }

  private async requireItem(
    landedCostId: string,
    itemId: string,
  ): Promise<LandedCostItemRow> {
    const [row] = await this.db
      .select()
      .from(landed_cost_items)
      .where(
        and(
          eq(landed_cost_items.id, itemId),
          eq(landed_cost_items.landed_cost_id, landedCostId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Landed cost item ${itemId} not found`);
    }
    return row as LandedCostItemRow;
  }

  private async requireLandedCostAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LandedCostRow> {
    const [row] = await this.db
      .select()
      .from(landed_costs)
      .where(and(eq(landed_costs.id, id), isNull(landed_costs.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Landed cost ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'landed cost',
    );
    return row as LandedCostRow;
  }

  /** Public access helper for nested fee-component services. */
  async requireAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LandedCostRow> {
    return this.requireLandedCostAccess(id, currentOrganizationId, user);
  }

  /** Access + refuse when posted (for fee writes). */
  async requireMutableAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LandedCostRow> {
    const header = await this.requireLandedCostAccess(
      id,
      currentOrganizationId,
      user,
    );
    this.assertMutable(header.status);
    return header;
  }

  /**
   * After a fee row write: reset header to draft and clear item allocations
   * (totals stay stale until calculate).
   */
  async markDraftAfterFeeChange(landedCostId: string): Promise<void> {
    await this.db
      .update(landed_costs)
      .set({
        status: LANDED_COST_STATUS.DRAFT,
        calculated_at: null,
        calculated_by: null,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(landed_costs.id, landedCostId));
    await this.clearItemAllocations(landedCostId);
  }

  private assertMutable(status: LandedCostStatus): void {
    if (status === LANDED_COST_STATUS.POSTED) {
      throw new BadRequestException(
        'Posted landed costs are immutable',
      );
    }
  }

  private assertHasPoOrShipment(
    purchaseOrderId: string | null | undefined,
    shipmentId: string | null | undefined,
  ): void {
    if (!purchaseOrderId && !shipmentId) {
      throw new BadRequestException(
        'At least one of purchaseOrderId or shipmentId is required',
      );
    }
  }

  private buildWhere(filters: {
    organizationId: string;
    search?: string;
    status?: LandedCostStatus;
    purchaseOrderId?: string;
    shipmentId?: string;
    currencyId?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(landed_costs.organization_id, filters.organizationId),
      isNull(landed_costs.deleted_at),
    ];
    if (filters.search) {
      parts.push(like(landed_costs.reference, `%${filters.search.trim()}%`));
    }
    if (filters.status) {
      parts.push(eq(landed_costs.status, filters.status));
    }
    if (filters.purchaseOrderId) {
      parts.push(eq(landed_costs.purchase_order_id, filters.purchaseOrderId));
    }
    if (filters.shipmentId) {
      parts.push(eq(landed_costs.shipment_id, filters.shipmentId));
    }
    if (filters.currencyId) {
      parts.push(eq(landed_costs.currency_id, filters.currencyId));
    }
    return and(...parts)!;
  }

  private async ensurePurchaseOrderInOrg(
    purchaseOrderId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: purchase_orders.id,
        organization_id: purchase_orders.organization_id,
        deleted_at: purchase_orders.deleted_at,
      })
      .from(purchase_orders)
      .where(eq(purchase_orders.id, purchaseOrderId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Purchase order ${purchaseOrderId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Purchase order must belong to the same organization',
      );
    }
  }

  private async ensureShipmentInOrg(
    shipmentId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: shipments.id,
        organization_id: shipments.organization_id,
        deleted_at: shipments.deleted_at,
      })
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Shipment ${shipmentId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Shipment must belong to the same organization',
      );
    }
  }

  private async ensurePoItemForHeader(
    purchaseOrderItemId: string,
    purchaseOrderId: string | null,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: purchase_order_items.id,
        purchase_order_id: purchase_order_items.purchase_order_id,
      })
      .from(purchase_order_items)
      .where(eq(purchase_order_items.id, purchaseOrderItemId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Purchase order item ${purchaseOrderItemId} not found`,
      );
    }
    if (purchaseOrderId && row.purchase_order_id !== purchaseOrderId) {
      throw new BadRequestException(
        'purchaseOrderItemId must belong to the landed cost purchase order',
      );
    }
  }

  private async ensureProductInOrg(
    productId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: products.id,
        organization_id: products.organization_id,
        deleted_at: products.deleted_at,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Product must belong to the same organization',
      );
    }
  }
}
