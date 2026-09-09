import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  inventory,
  sales_order_items,
  sales_orders,
  stock_reservations,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { InventoryMovementsService } from '../inventory/inventory-movements.service';
import { formatDecimal } from '../inventory/inventory-quantities';
import {
  assertOrgAccess,
  requireScopeOrgId,
} from '../stock-scope';
import {
  CreateStockReservationDto,
  ListStockReservationsQueryDto,
  type ReservationStatus,
  StockReservationResponseDto,
} from './dto/stock-reservation.dto';

export type StockReservationRow = {
  id: string;
  inventory_id: string;
  sales_order_id: string | null;
  sales_order_item_id: string | null;
  quantity: string;
  status: ReservationStatus;
  reserved_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

function toResponse(row: StockReservationRow): StockReservationResponseDto {
  return {
    id: row.id,
    inventoryId: row.inventory_id,
    salesOrderId: row.sales_order_id,
    salesOrderItemId: row.sales_order_item_id,
    quantity: row.quantity,
    status: row.status,
    reservedAt: row.reserved_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class StockReservationsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly inventoryMovementsService: InventoryMovementsService,
  ) {}

  async findAll(
    query: ListStockReservationsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<StockReservationResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      inventoryId,
      salesOrderId,
      salesOrderItemId,
      status,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );

    // Scope via inventory.organization_id join filter
    const parts: SQL[] = [eq(inventory.organization_id, scopeOrgId)];
    if (inventoryId) {
      parts.push(eq(stock_reservations.inventory_id, inventoryId));
    }
    if (salesOrderId) {
      parts.push(eq(stock_reservations.sales_order_id, salesOrderId));
    }
    if (salesOrderItemId) {
      parts.push(
        eq(stock_reservations.sales_order_item_id, salesOrderItemId),
      );
    }
    if (status) parts.push(eq(stock_reservations.status, status));
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db
      .select({
        id: stock_reservations.id,
        inventory_id: stock_reservations.inventory_id,
        sales_order_id: stock_reservations.sales_order_id,
        sales_order_item_id: stock_reservations.sales_order_item_id,
        quantity: stock_reservations.quantity,
        status: stock_reservations.status,
        reserved_at: stock_reservations.reserved_at,
        expires_at: stock_reservations.expires_at,
        created_at: stock_reservations.created_at,
        updated_at: stock_reservations.updated_at,
      })
      .from(stock_reservations)
      .innerJoin(inventory, eq(stock_reservations.inventory_id, inventory.id))
      .$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(stock_reservations)
      .innerJoin(inventory, eq(stock_reservations.inventory_id, inventory.id))
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(
          desc(stock_reservations.reserved_at),
          asc(stock_reservations.id),
        )
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as StockReservationRow[]).map(toResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<StockReservationResponseDto> {
    const row = await this.requireReservationAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toResponse(row);
  }

  async create(
    dto: CreateStockReservationDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<StockReservationResponseDto> {
    const inv = await this.requireInventoryAccess(
      dto.inventoryId,
      currentOrganizationId,
      user,
    );
    const soItem = await this.requireSalesOrderItemInOrg(
      dto.salesOrderItemId,
      inv.organization_id,
    );
    const quantity = formatDecimal(Number(dto.quantity));
    if (!(Number(quantity) > 0)) {
      throw new BadRequestException('quantity must be greater than zero');
    }

    const id = createId();
    const now = nowMysqlDateTime();
    const expiresAt = dto.expiresAt
      ? dto.expiresAt.replace('T', ' ').replace('Z', '').slice(0, 23)
      : null;

    await this.db.transaction(async (tx) => {
      await this.inventoryMovementsService.applyMovement(
        {
          organizationId: inv.organization_id,
          productId: inv.product_id,
          warehouseId: inv.warehouse_id,
          locationId: inv.location_id,
          batchId: inv.batch_id,
          movementType: 'reserve',
          quantity,
          referenceType: 'stock_reservation',
          referenceId: id,
          movedAt: now,
          movedBy: user?.id ?? null,
        },
        tx,
      );

      try {
        await tx.insert(stock_reservations).values({
          id,
          inventory_id: dto.inventoryId,
          sales_order_id: soItem.sales_order_id,
          sales_order_item_id: dto.salesOrderItemId,
          quantity,
          status: 'active',
          reserved_at: now,
          expires_at: expiresAt,
          created_at: now,
          updated_at: now,
        });
      } catch (error) {
        throwFkOrRethrow(
          error,
          'Invalid inventory or sales order item reference',
        );
      }
    });

    return this.findOne(id, currentOrganizationId, user);
  }

  async release(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<StockReservationResponseDto> {
    const reservation = await this.requireReservationAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (reservation.status !== 'active') {
      throw new BadRequestException(
        'Only an active reservation can be released',
      );
    }
    const inv = await this.requireInventoryAccess(
      reservation.inventory_id,
      currentOrganizationId,
      user,
    );

    await this.db.transaction(async (tx) => {
      await this.inventoryMovementsService.applyMovement(
        {
          organizationId: inv.organization_id,
          productId: inv.product_id,
          warehouseId: inv.warehouse_id,
          locationId: inv.location_id,
          batchId: inv.batch_id,
          movementType: 'unreserve',
          quantity: reservation.quantity,
          referenceType: 'stock_reservation',
          referenceId: id,
          movedBy: user?.id ?? null,
          notes: 'Reservation released',
        },
        tx,
      );
      await tx
        .update(stock_reservations)
        .set({
          status: 'released',
          updated_at: nowMysqlDateTime(),
        })
        .where(eq(stock_reservations.id, id));
    });

    return this.findOne(id, currentOrganizationId, user);
  }

  async fulfill(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<StockReservationResponseDto> {
    const reservation = await this.requireReservationAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (reservation.status !== 'active') {
      throw new BadRequestException(
        'Only an active reservation can be fulfilled',
      );
    }
    const inv = await this.requireInventoryAccess(
      reservation.inventory_id,
      currentOrganizationId,
      user,
    );

    await this.db.transaction(async (tx) => {
      // Return reserved qty to available, then consume via out.
      await this.inventoryMovementsService.applyMovement(
        {
          organizationId: inv.organization_id,
          productId: inv.product_id,
          warehouseId: inv.warehouse_id,
          locationId: inv.location_id,
          batchId: inv.batch_id,
          movementType: 'unreserve',
          quantity: reservation.quantity,
          referenceType: 'stock_reservation',
          referenceId: id,
          movedBy: user?.id ?? null,
          notes: 'Reservation fulfill — unreserve',
        },
        tx,
      );
      await this.inventoryMovementsService.applyMovement(
        {
          organizationId: inv.organization_id,
          productId: inv.product_id,
          warehouseId: inv.warehouse_id,
          locationId: inv.location_id,
          batchId: inv.batch_id,
          movementType: 'out',
          quantity: reservation.quantity,
          referenceType: 'stock_reservation',
          referenceId: id,
          movedBy: user?.id ?? null,
          notes: 'Reservation fulfill — out',
        },
        tx,
      );
      await tx
        .update(stock_reservations)
        .set({
          status: 'fulfilled',
          updated_at: nowMysqlDateTime(),
        })
        .where(eq(stock_reservations.id, id));
    });

    return this.findOne(id, currentOrganizationId, user);
  }

  private async requireReservationAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<StockReservationRow> {
    const [row] = await this.db
      .select({
        id: stock_reservations.id,
        inventory_id: stock_reservations.inventory_id,
        sales_order_id: stock_reservations.sales_order_id,
        sales_order_item_id: stock_reservations.sales_order_item_id,
        quantity: stock_reservations.quantity,
        status: stock_reservations.status,
        reserved_at: stock_reservations.reserved_at,
        expires_at: stock_reservations.expires_at,
        created_at: stock_reservations.created_at,
        updated_at: stock_reservations.updated_at,
        organization_id: inventory.organization_id,
      })
      .from(stock_reservations)
      .innerJoin(inventory, eq(stock_reservations.inventory_id, inventory.id))
      .where(eq(stock_reservations.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Stock reservation ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'stock reservation',
    );
    const { organization_id: _, ...reservation } = row;
    return reservation as StockReservationRow;
  }

  private async requireInventoryAccess(
    inventoryId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<{
    id: string;
    organization_id: string;
    warehouse_id: string;
    location_id: string | null;
    product_id: string;
    batch_id: string | null;
  }> {
    const [row] = await this.db
      .select({
        id: inventory.id,
        organization_id: inventory.organization_id,
        warehouse_id: inventory.warehouse_id,
        location_id: inventory.location_id,
        product_id: inventory.product_id,
        batch_id: inventory.batch_id,
      })
      .from(inventory)
      .where(eq(inventory.id, inventoryId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Inventory ${inventoryId} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'inventory',
    );
    return row;
  }

  private async requireSalesOrderItemInOrg(
    salesOrderItemId: string,
    organizationId: string,
  ): Promise<{ sales_order_id: string }> {
    const [row] = await this.db
      .select({
        id: sales_order_items.id,
        sales_order_id: sales_order_items.sales_order_id,
        organization_id: sales_orders.organization_id,
      })
      .from(sales_order_items)
      .innerJoin(
        sales_orders,
        eq(sales_order_items.sales_order_id, sales_orders.id),
      )
      .where(eq(sales_order_items.id, salesOrderItemId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Sales order item ${salesOrderItemId} not found`,
      );
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Sales order item must belong to the same organization',
      );
    }
    return { sales_order_id: row.sales_order_id };
  }
}
