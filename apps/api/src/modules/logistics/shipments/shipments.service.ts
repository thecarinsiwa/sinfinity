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
  carriers,
  products,
  purchase_order_items,
  purchase_orders,
  shipment_items,
  shipment_tracking,
  shipments,
  shipping_methods,
} from '../../../database/schema';
import {
  isMysqlDuplicateError,
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { formatDecimal } from '../../purchase-orders/purchase-orders-totals';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../logistics-scope';
import {
  CreateShipmentDto,
  CreateShipmentItemDto,
  CreateShipmentTrackingDto,
  ListShipmentsQueryDto,
  ShipmentItemResponseDto,
  ShipmentResponseDto,
  ShipmentTrackingResponseDto,
  TransitionShipmentDto,
  UpdateShipmentDto,
  UpdateShipmentItemDto,
  UpdateShipmentTrackingDto,
} from './dto/shipment.dto';
import {
  assertShipmentTransition,
  SHIPMENT_STATUS,
  type ShipmentStatus,
} from './shipment-statuses';
import {
  toShipmentItemResponse,
  toShipmentResponse,
  toShipmentTrackingResponse,
  type ShipmentItemRow,
  type ShipmentRow,
  type ShipmentTrackingRow,
} from './shipments.mapper';

function toMysqlDate(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.slice(0, 10);
}

function toMysqlDateTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace('T', ' ').replace('Z', '');
}

@Injectable()
export class ShipmentsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListShipmentsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<ShipmentResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      search,
      status,
      purchaseOrderId,
      carrierId,
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
      carrierId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(shipments).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(shipments)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(shipments.created_at), asc(shipments.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ShipmentRow[]).map((row) => toShipmentResponse(row)),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ShipmentResponseDto> {
    const row = await this.requireShipmentAccess(
      id,
      currentOrganizationId,
      user,
    );
    const items = await this.loadItems(id);
    return toShipmentResponse(row, items.map(toShipmentItemResponse));
  }

  async create(
    dto: CreateShipmentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ShipmentResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'shipment',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensurePurchaseOrderInOrg(dto.purchaseOrderId, organizationId);
    if (dto.carrierId) {
      await this.ensureCarrierInOrg(dto.carrierId, organizationId);
    }
    if (dto.shippingMethodId) {
      await this.ensureShippingMethodExists(dto.shippingMethodId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(shipments).values({
        id,
        organization_id: organizationId,
        shipment_number: dto.shipmentNumber.trim(),
        purchase_order_id: dto.purchaseOrderId,
        carrier_id: dto.carrierId ?? null,
        shipping_method_id: dto.shippingMethodId ?? null,
        container_number: dto.containerNumber ?? null,
        bl_number: dto.blNumber ?? null,
        origin_country_id: dto.originCountryId ?? null,
        destination_country_id: dto.destinationCountryId ?? null,
        etd: toMysqlDate(dto.etd),
        eta: toMysqlDate(dto.eta),
        atd: toMysqlDate(dto.atd),
        ata: toMysqlDate(dto.ata),
        status: SHIPMENT_STATUS.BOOKED,
        created_at: now,
        updated_at: now,
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Shipment number already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid purchase order, carrier, shipping method or country reference',
      );
    }

    if (dto.items?.length) {
      for (const item of dto.items) {
        await this.insertItem(id, dto.purchaseOrderId, organizationId, item);
      }
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateShipmentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ShipmentResponseDto> {
    const shipment = await this.requireShipmentAccess(
      id,
      currentOrganizationId,
      user,
    );
    this.assertHeaderEditable(shipment.status);

    if (dto.carrierId) {
      await this.ensureCarrierInOrg(dto.carrierId, shipment.organization_id);
    }
    if (dto.shippingMethodId) {
      await this.ensureShippingMethodExists(dto.shippingMethodId);
    }

    const patch: Record<string, unknown> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };
    if (dto.shipmentNumber !== undefined) {
      patch.shipment_number = dto.shipmentNumber.trim();
    }
    if (dto.carrierId !== undefined) patch.carrier_id = dto.carrierId;
    if (dto.shippingMethodId !== undefined) {
      patch.shipping_method_id = dto.shippingMethodId;
    }
    if (dto.containerNumber !== undefined) {
      patch.container_number = dto.containerNumber;
    }
    if (dto.blNumber !== undefined) patch.bl_number = dto.blNumber;
    if (dto.originCountryId !== undefined) {
      patch.origin_country_id = dto.originCountryId;
    }
    if (dto.destinationCountryId !== undefined) {
      patch.destination_country_id = dto.destinationCountryId;
    }
    if (dto.etd !== undefined) patch.etd = toMysqlDate(dto.etd);
    if (dto.eta !== undefined) patch.eta = toMysqlDate(dto.eta);
    if (dto.atd !== undefined) patch.atd = toMysqlDate(dto.atd);
    if (dto.ata !== undefined) patch.ata = toMysqlDate(dto.ata);

    try {
      await this.db.update(shipments).set(patch).where(eq(shipments.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Shipment number already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid carrier, shipping method or country reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireShipmentAccess(id, currentOrganizationId, user);
    await this.db
      .update(shipments)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(shipments.id, id));
  }

  async transition(
    id: string,
    dto: TransitionShipmentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ShipmentResponseDto> {
    const shipment = await this.requireShipmentAccess(
      id,
      currentOrganizationId,
      user,
    );
    const fromStatus = shipment.status;
    const toStatus = dto.toStatus;

    try {
      assertShipmentTransition(fromStatus, toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    const now = nowMysqlDateTime();
    await this.db
      .update(shipments)
      .set({
        status: toStatus,
        updated_at: now,
        updated_by: user?.id ?? null,
      })
      .where(eq(shipments.id, id));

    await this.db.insert(shipment_tracking).values({
      id: createId(),
      shipment_id: id,
      status: toStatus,
      location: dto.location ?? null,
      event_at: now,
      description: dto.notes ?? `Status changed to ${toStatus}`,
      source: 'manual',
      created_at: now,
    });

    return this.findOne(id, currentOrganizationId, user);
  }

  // --- Items ---

  async listItems(
    shipmentId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ShipmentItemResponseDto[]> {
    await this.requireShipmentAccess(shipmentId, currentOrganizationId, user);
    return (await this.loadItems(shipmentId)).map(toShipmentItemResponse);
  }

  async addItem(
    shipmentId: string,
    dto: CreateShipmentItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ShipmentItemResponseDto> {
    const shipment = await this.requireShipmentAccess(
      shipmentId,
      currentOrganizationId,
      user,
    );
    this.assertNestedEditable(shipment.status);
    if (!shipment.purchase_order_id) {
      throw new BadRequestException('Shipment has no purchase order link');
    }
    const itemId = await this.insertItem(
      shipmentId,
      shipment.purchase_order_id,
      shipment.organization_id,
      dto,
    );
    return this.findItem(shipmentId, itemId);
  }

  async updateItem(
    shipmentId: string,
    itemId: string,
    dto: UpdateShipmentItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ShipmentItemResponseDto> {
    const shipment = await this.requireShipmentAccess(
      shipmentId,
      currentOrganizationId,
      user,
    );
    this.assertNestedEditable(shipment.status);
    const existing = await this.requireItem(shipmentId, itemId);

    const nextPoItemId =
      dto.purchaseOrderItemId !== undefined
        ? dto.purchaseOrderItemId
        : existing.purchase_order_item_id;
    const nextProductId =
      dto.productId !== undefined ? dto.productId : existing.product_id;
    this.assertItemHasContent({
      purchaseOrderItemId: nextPoItemId,
      productId: nextProductId,
    });

    if (nextPoItemId && shipment.purchase_order_id) {
      await this.ensurePoItemOnOrder(
        nextPoItemId,
        shipment.purchase_order_id,
      );
    }
    if (nextProductId) {
      await this.ensureProductInOrg(
        nextProductId,
        shipment.organization_id,
      );
    }

    const patch: Record<string, unknown> = {
      updated_at: nowMysqlDateTime(),
    };
    if (dto.purchaseOrderItemId !== undefined) {
      patch.purchase_order_item_id = dto.purchaseOrderItemId;
    }
    if (dto.productId !== undefined) patch.product_id = dto.productId;
    if (dto.quantity !== undefined) {
      patch.quantity = formatDecimal(Number(dto.quantity));
    }
    if (dto.weightKg !== undefined) {
      patch.weight_kg =
        dto.weightKg == null ? null : formatDecimal(Number(dto.weightKg));
    }
    if (dto.volumeCbm !== undefined) {
      patch.volume_cbm =
        dto.volumeCbm == null ? null : formatDecimal(Number(dto.volumeCbm));
    }

    try {
      await this.db
        .update(shipment_items)
        .set(patch)
        .where(eq(shipment_items.id, itemId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid product or purchase order item');
    }

    return this.findItem(shipmentId, itemId);
  }

  async removeItem(
    shipmentId: string,
    itemId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const shipment = await this.requireShipmentAccess(
      shipmentId,
      currentOrganizationId,
      user,
    );
    this.assertNestedEditable(shipment.status);
    await this.requireItem(shipmentId, itemId);
    await this.db
      .delete(shipment_items)
      .where(eq(shipment_items.id, itemId));
  }

  // --- Tracking ---

  async listTracking(
    shipmentId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ShipmentTrackingResponseDto[]> {
    await this.requireShipmentAccess(shipmentId, currentOrganizationId, user);
    const rows = await this.db
      .select()
      .from(shipment_tracking)
      .where(eq(shipment_tracking.shipment_id, shipmentId))
      .orderBy(
        asc(shipment_tracking.event_at),
        asc(shipment_tracking.id),
      );
    return (rows as ShipmentTrackingRow[]).map(toShipmentTrackingResponse);
  }

  async addTracking(
    shipmentId: string,
    dto: CreateShipmentTrackingDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ShipmentTrackingResponseDto> {
    const shipment = await this.requireShipmentAccess(
      shipmentId,
      currentOrganizationId,
      user,
    );
    this.assertNestedEditable(shipment.status);

    const id = createId();
    await this.db.insert(shipment_tracking).values({
      id,
      shipment_id: shipmentId,
      status: dto.status,
      location: dto.location ?? null,
      event_at: toMysqlDateTime(dto.eventAt)!,
      description: dto.description ?? null,
      source: dto.source ?? 'manual',
      created_at: nowMysqlDateTime(),
    });

    return this.findTracking(shipmentId, id);
  }

  async updateTracking(
    shipmentId: string,
    eventId: string,
    dto: UpdateShipmentTrackingDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ShipmentTrackingResponseDto> {
    const shipment = await this.requireShipmentAccess(
      shipmentId,
      currentOrganizationId,
      user,
    );
    this.assertNestedEditable(shipment.status);
    await this.requireTracking(shipmentId, eventId);

    const patch: Record<string, unknown> = {};
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.location !== undefined) patch.location = dto.location;
    if (dto.eventAt !== undefined) {
      patch.event_at = toMysqlDateTime(dto.eventAt);
    }
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.source !== undefined) patch.source = dto.source;

    if (Object.keys(patch).length > 0) {
      await this.db
        .update(shipment_tracking)
        .set(patch)
        .where(eq(shipment_tracking.id, eventId));
    }

    return this.findTracking(shipmentId, eventId);
  }

  async removeTracking(
    shipmentId: string,
    eventId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const shipment = await this.requireShipmentAccess(
      shipmentId,
      currentOrganizationId,
      user,
    );
    this.assertNestedEditable(shipment.status);
    await this.requireTracking(shipmentId, eventId);
    await this.db
      .delete(shipment_tracking)
      .where(eq(shipment_tracking.id, eventId));
  }

  // --- helpers ---

  private async insertItem(
    shipmentId: string,
    purchaseOrderId: string,
    organizationId: string,
    dto: CreateShipmentItemDto,
  ): Promise<string> {
    this.assertItemHasContent(dto);
    if (dto.purchaseOrderItemId) {
      await this.ensurePoItemOnOrder(dto.purchaseOrderItemId, purchaseOrderId);
    }
    if (dto.productId) {
      await this.ensureProductInOrg(dto.productId, organizationId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(shipment_items).values({
        id,
        shipment_id: shipmentId,
        purchase_order_item_id: dto.purchaseOrderItemId ?? null,
        product_id: dto.productId ?? null,
        quantity: formatDecimal(Number(dto.quantity)),
        weight_kg:
          dto.weightKg == null ? null : formatDecimal(Number(dto.weightKg)),
        volume_cbm:
          dto.volumeCbm == null ? null : formatDecimal(Number(dto.volumeCbm)),
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid product or purchase order item');
    }
    return id;
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    status?: ShipmentStatus;
    purchaseOrderId?: string;
    carrierId?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(shipments.organization_id, params.organizationId),
      isNull(shipments.deleted_at),
    ];
    if (params.status) parts.push(eq(shipments.status, params.status));
    if (params.purchaseOrderId) {
      parts.push(eq(shipments.purchase_order_id, params.purchaseOrderId));
    }
    if (params.carrierId) {
      parts.push(eq(shipments.carrier_id, params.carrierId));
    }
    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      parts.push(like(shipments.shipment_number, term));
    }
    return and(...parts)!;
  }

  private async requireShipmentAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ShipmentRow> {
    const [row] = await this.db
      .select()
      .from(shipments)
      .where(and(eq(shipments.id, id), isNull(shipments.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Shipment ${id} not found`);
    }
    assertOrgAccess(
      (row as ShipmentRow).organization_id,
      currentOrganizationId,
      user,
      'shipment',
    );
    return row as ShipmentRow;
  }

  private assertHeaderEditable(status: ShipmentStatus): void {
    if (
      status === SHIPMENT_STATUS.DELIVERED ||
      status === SHIPMENT_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        'Shipment header cannot be edited while delivered or cancelled',
      );
    }
  }

  private assertNestedEditable(status: ShipmentStatus): void {
    if (
      status === SHIPMENT_STATUS.DELIVERED ||
      status === SHIPMENT_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        'Shipment items/tracking cannot be mutated while delivered or cancelled',
      );
    }
  }

  private assertItemHasContent(
    dto: Pick<CreateShipmentItemDto, 'purchaseOrderItemId' | 'productId'>,
  ): void {
    const hasPoItem =
      dto.purchaseOrderItemId != null && dto.purchaseOrderItemId !== '';
    const hasProduct = dto.productId != null && dto.productId !== '';
    if (!hasPoItem && !hasProduct) {
      throw new BadRequestException(
        'Item requires at least one of purchaseOrderItemId or productId',
      );
    }
  }

  private async loadItems(shipmentId: string): Promise<ShipmentItemRow[]> {
    const rows = await this.db
      .select()
      .from(shipment_items)
      .where(eq(shipment_items.shipment_id, shipmentId))
      .orderBy(asc(shipment_items.created_at), asc(shipment_items.id));
    return rows as ShipmentItemRow[];
  }

  private async findItem(
    shipmentId: string,
    itemId: string,
  ): Promise<ShipmentItemResponseDto> {
    return toShipmentItemResponse(
      await this.requireItem(shipmentId, itemId),
    );
  }

  private async requireItem(
    shipmentId: string,
    itemId: string,
  ): Promise<ShipmentItemRow> {
    const [row] = await this.db
      .select()
      .from(shipment_items)
      .where(
        and(
          eq(shipment_items.id, itemId),
          eq(shipment_items.shipment_id, shipmentId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Shipment item ${itemId} not found`);
    }
    return row as ShipmentItemRow;
  }

  private async findTracking(
    shipmentId: string,
    eventId: string,
  ): Promise<ShipmentTrackingResponseDto> {
    return toShipmentTrackingResponse(
      await this.requireTracking(shipmentId, eventId),
    );
  }

  private async requireTracking(
    shipmentId: string,
    eventId: string,
  ): Promise<ShipmentTrackingRow> {
    const [row] = await this.db
      .select()
      .from(shipment_tracking)
      .where(
        and(
          eq(shipment_tracking.id, eventId),
          eq(shipment_tracking.shipment_id, shipmentId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Shipment tracking event ${eventId} not found`);
    }
    return row as ShipmentTrackingRow;
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

  private async ensurePoItemOnOrder(
    purchaseOrderItemId: string,
    purchaseOrderId: string,
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
    if (row.purchase_order_id !== purchaseOrderId) {
      throw new BadRequestException(
        'purchaseOrderItemId must belong to the shipment purchase order',
      );
    }
  }

  private async ensureCarrierInOrg(
    carrierId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: carriers.id,
        organization_id: carriers.organization_id,
        deleted_at: carriers.deleted_at,
      })
      .from(carriers)
      .where(eq(carriers.id, carrierId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Carrier ${carrierId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Carrier must belong to the same organization',
      );
    }
  }

  private async ensureShippingMethodExists(methodId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: shipping_methods.id })
      .from(shipping_methods)
      .where(eq(shipping_methods.id, methodId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Shipping method ${methodId} not found`);
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
