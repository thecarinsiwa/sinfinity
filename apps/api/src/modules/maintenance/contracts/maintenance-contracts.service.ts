import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, isNull, like, type SQL } from 'drizzle-orm';
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
  customers,
  maintenance_contract_items,
  maintenance_contracts,
  maintenance_schedules,
  products,
  serial_numbers,
  technicians,
} from '../../../database/schema';
import {
  isMysqlDuplicateError,
  throwDuplicateOrRethrow,
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
} from '../maintenance-scope';
import {
  assertContractTransition,
  CONTRACT_STATUS,
  type ContractStatus,
} from '../contract-statuses';
import {
  SCHEDULE_FREQUENCY,
  type ScheduleFrequency,
} from '../schedule-frequencies';
import {
  CreateMaintenanceContractDto,
  CreateMaintenanceContractItemDto,
  CreateMaintenanceScheduleDto,
  ListMaintenanceContractsQueryDto,
  MaintenanceContractItemResponseDto,
  MaintenanceContractResponseDto,
  MaintenanceScheduleResponseDto,
  TransitionMaintenanceContractDto,
  UpdateMaintenanceContractDto,
  UpdateMaintenanceContractItemDto,
  UpdateMaintenanceScheduleDto,
} from './dto/maintenance-contract.dto';
import {
  toMaintenanceContractItemResponse,
  toMaintenanceContractResponse,
  toMaintenanceScheduleResponse,
  type MaintenanceContractItemRow,
  type MaintenanceContractRow,
  type MaintenanceScheduleRow,
} from './maintenance-contracts.mapper';

function toDateOnly(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.slice(0, 10);
}

@Injectable()
export class MaintenanceContractsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListMaintenanceContractsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<MaintenanceContractResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      search,
      status,
      customerId,
      includeDeleted,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [
      eq(maintenance_contracts.organization_id, scopeOrgId),
    ];
    if (!includeDeleted) {
      parts.push(isNull(maintenance_contracts.deleted_at));
    }
    if (search?.trim()) {
      parts.push(
        like(maintenance_contracts.contract_number, `%${search.trim()}%`),
      );
    }
    if (status) parts.push(eq(maintenance_contracts.status, status));
    if (customerId) {
      parts.push(eq(maintenance_contracts.customer_id, customerId));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(maintenance_contracts).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(maintenance_contracts)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(
          desc(maintenance_contracts.created_at),
          asc(maintenance_contracts.id),
        )
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as MaintenanceContractRow[]).map((row) =>
        toMaintenanceContractResponse(row),
      ),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceContractResponseDto> {
    const row = await this.requireContractAccess(
      id,
      currentOrganizationId,
      user,
    );
    const [items, schedules] = await Promise.all([
      this.loadItems(id),
      this.loadSchedules(id),
    ]);
    return toMaintenanceContractResponse(row, items, schedules);
  }

  async create(
    dto: CreateMaintenanceContractDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceContractResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'maintenance contract',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureCustomerInOrg(dto.customerId, organizationId);
    if (dto.currencyId) {
      await this.ensureCurrencyExists(dto.currencyId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(maintenance_contracts).values({
        id,
        organization_id: organizationId,
        contract_number: dto.contractNumber.trim(),
        customer_id: dto.customerId,
        start_date: toDateOnly(dto.startDate)!,
        end_date: toDateOnly(dto.endDate),
        sla_hours: dto.slaHours ?? null,
        status: CONTRACT_STATUS.DRAFT,
        amount: dto.amount ?? null,
        currency_id: dto.currencyId ?? null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Contract number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid maintenance contract reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateMaintenanceContractDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceContractResponseDto> {
    const existing = await this.requireContractAccess(
      id,
      currentOrganizationId,
      user,
    );
    this.assertMutable(existing.status);

    if (dto.customerId) {
      await this.ensureCustomerInOrg(dto.customerId, existing.organization_id);
    }
    if (dto.currencyId) {
      await this.ensureCurrencyExists(dto.currencyId);
    }

    const patch: Partial<{
      contract_number: string;
      customer_id: string;
      start_date: string;
      end_date: string | null;
      sla_hours: number | null;
      amount: string | null;
      currency_id: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.contractNumber !== undefined) {
      patch.contract_number = dto.contractNumber.trim();
    }
    if (dto.customerId !== undefined) patch.customer_id = dto.customerId;
    if (dto.startDate !== undefined) {
      patch.start_date = toDateOnly(dto.startDate)!;
    }
    if (dto.endDate !== undefined) patch.end_date = toDateOnly(dto.endDate);
    if (dto.slaHours !== undefined) patch.sla_hours = dto.slaHours;
    if (dto.amount !== undefined) patch.amount = dto.amount;
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;

    try {
      await this.db
        .update(maintenance_contracts)
        .set(patch)
        .where(eq(maintenance_contracts.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Contract number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid maintenance contract reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.requireContractAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (
      existing.status !== CONTRACT_STATUS.DRAFT &&
      existing.status !== CONTRACT_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        'Only a draft or cancelled contract can be soft-deleted',
      );
    }
    await this.db
      .update(maintenance_contracts)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(maintenance_contracts.id, id));
  }

  async transition(
    id: string,
    dto: TransitionMaintenanceContractDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceContractResponseDto> {
    const existing = await this.requireContractAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertContractTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    await this.db
      .update(maintenance_contracts)
      .set({
        status: dto.toStatus,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(maintenance_contracts.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  async listItems(
    contractId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceContractItemResponseDto[]> {
    await this.requireContractAccess(contractId, currentOrganizationId, user);
    const items = await this.loadItems(contractId);
    return items.map(toMaintenanceContractItemResponse);
  }

  async createItem(
    contractId: string,
    dto: CreateMaintenanceContractItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceContractItemResponseDto> {
    const contract = await this.requireContractAccess(
      contractId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(contract.status);
    await this.ensureProductInOrg(dto.productId, contract.organization_id);
    if (dto.serialNumberId) {
      await this.ensureSerialForProduct(
        dto.serialNumberId,
        contract.organization_id,
        dto.productId,
      );
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(maintenance_contract_items).values({
        id,
        maintenance_contract_id: contractId,
        product_id: dto.productId,
        serial_number_id: dto.serialNumberId ?? null,
        coverage_level: dto.coverageLevel?.trim() || null,
        notes: dto.notes ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid contract item reference');
    }

    return this.requireItem(contractId, id);
  }

  async updateItem(
    contractId: string,
    itemId: string,
    dto: UpdateMaintenanceContractItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceContractItemResponseDto> {
    const contract = await this.requireContractAccess(
      contractId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(contract.status);
    const existing = await this.requireItemRow(contractId, itemId);

    const productId = dto.productId ?? existing.product_id;
    if (!productId) {
      throw new BadRequestException('productId is required');
    }
    if (dto.productId) {
      await this.ensureProductInOrg(dto.productId, contract.organization_id);
    }
    const serialNumberId =
      dto.serialNumberId !== undefined
        ? dto.serialNumberId
        : existing.serial_number_id;
    if (serialNumberId) {
      await this.ensureSerialForProduct(
        serialNumberId,
        contract.organization_id,
        productId,
      );
    }

    const patch: Partial<{
      product_id: string;
      serial_number_id: string | null;
      coverage_level: string | null;
      notes: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.productId !== undefined) patch.product_id = dto.productId;
    if (dto.serialNumberId !== undefined) {
      patch.serial_number_id = dto.serialNumberId;
    }
    if (dto.coverageLevel !== undefined) {
      patch.coverage_level = dto.coverageLevel?.trim() || null;
    }
    if (dto.notes !== undefined) patch.notes = dto.notes;

    try {
      await this.db
        .update(maintenance_contract_items)
        .set(patch)
        .where(eq(maintenance_contract_items.id, itemId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid contract item reference');
    }

    return this.requireItem(contractId, itemId);
  }

  async removeItem(
    contractId: string,
    itemId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const contract = await this.requireContractAccess(
      contractId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(contract.status);
    await this.requireItemRow(contractId, itemId);
    await this.db
      .delete(maintenance_contract_items)
      .where(eq(maintenance_contract_items.id, itemId));
  }

  async listSchedules(
    contractId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceScheduleResponseDto[]> {
    await this.requireContractAccess(contractId, currentOrganizationId, user);
    const schedules = await this.loadSchedules(contractId);
    return schedules.map(toMaintenanceScheduleResponse);
  }

  async createSchedule(
    contractId: string,
    dto: CreateMaintenanceScheduleDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceScheduleResponseDto> {
    const contract = await this.requireContractAccess(
      contractId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(contract.status);
    if (dto.technicianId) {
      await this.ensureTechnicianInOrg(
        dto.technicianId,
        contract.organization_id,
      );
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(maintenance_schedules).values({
        id,
        maintenance_contract_id: contractId,
        title: dto.title.trim(),
        frequency: dto.frequency ?? SCHEDULE_FREQUENCY.QUARTERLY,
        next_due_at: toDateOnly(dto.nextDueAt),
        technician_id: dto.technicianId ?? null,
        is_active: fromBool(dto.isActive ?? true),
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid maintenance schedule reference');
    }

    return this.requireSchedule(contractId, id);
  }

  async updateSchedule(
    contractId: string,
    scheduleId: string,
    dto: UpdateMaintenanceScheduleDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceScheduleResponseDto> {
    const contract = await this.requireContractAccess(
      contractId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(contract.status);
    await this.requireScheduleRow(contractId, scheduleId);

    if (dto.technicianId) {
      await this.ensureTechnicianInOrg(
        dto.technicianId,
        contract.organization_id,
      );
    }

    const patch: Partial<{
      title: string;
      frequency: ScheduleFrequency;
      next_due_at: string | null;
      technician_id: string | null;
      is_active: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.frequency !== undefined) patch.frequency = dto.frequency;
    if (dto.nextDueAt !== undefined) {
      patch.next_due_at = toDateOnly(dto.nextDueAt);
    }
    if (dto.technicianId !== undefined) {
      patch.technician_id = dto.technicianId;
    }
    if (dto.isActive !== undefined) patch.is_active = fromBool(dto.isActive);

    try {
      await this.db
        .update(maintenance_schedules)
        .set(patch)
        .where(eq(maintenance_schedules.id, scheduleId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid maintenance schedule reference');
    }

    return this.requireSchedule(contractId, scheduleId);
  }

  async removeSchedule(
    contractId: string,
    scheduleId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const contract = await this.requireContractAccess(
      contractId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(contract.status);
    await this.requireScheduleRow(contractId, scheduleId);
    await this.db
      .delete(maintenance_schedules)
      .where(eq(maintenance_schedules.id, scheduleId));
  }

  private assertMutable(status: ContractStatus): void {
    if (
      status === CONTRACT_STATUS.EXPIRED ||
      status === CONTRACT_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot modify a contract in status "${status}"`,
      );
    }
  }

  private async loadItems(
    contractId: string,
  ): Promise<MaintenanceContractItemRow[]> {
    const rows = await this.db
      .select()
      .from(maintenance_contract_items)
      .where(eq(maintenance_contract_items.maintenance_contract_id, contractId))
      .orderBy(
        asc(maintenance_contract_items.created_at),
        asc(maintenance_contract_items.id),
      );
    return rows;
  }

  private async loadSchedules(
    contractId: string,
  ): Promise<MaintenanceScheduleRow[]> {
    const rows = await this.db
      .select()
      .from(maintenance_schedules)
      .where(eq(maintenance_schedules.maintenance_contract_id, contractId))
      .orderBy(
        asc(maintenance_schedules.created_at),
        asc(maintenance_schedules.id),
      );
    return rows;
  }

  private async requireItem(
    contractId: string,
    itemId: string,
  ): Promise<MaintenanceContractItemResponseDto> {
    const row = await this.requireItemRow(contractId, itemId);
    return toMaintenanceContractItemResponse(row);
  }

  private async requireItemRow(
    contractId: string,
    itemId: string,
  ): Promise<MaintenanceContractItemRow> {
    const [row] = await this.db
      .select()
      .from(maintenance_contract_items)
      .where(
        and(
          eq(maintenance_contract_items.id, itemId),
          eq(maintenance_contract_items.maintenance_contract_id, contractId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Contract item ${itemId} not found on contract ${contractId}`,
      );
    }
    return row;
  }

  private async requireSchedule(
    contractId: string,
    scheduleId: string,
  ): Promise<MaintenanceScheduleResponseDto> {
    const row = await this.requireScheduleRow(contractId, scheduleId);
    return toMaintenanceScheduleResponse(row);
  }

  private async requireScheduleRow(
    contractId: string,
    scheduleId: string,
  ): Promise<MaintenanceScheduleRow> {
    const [row] = await this.db
      .select()
      .from(maintenance_schedules)
      .where(
        and(
          eq(maintenance_schedules.id, scheduleId),
          eq(maintenance_schedules.maintenance_contract_id, contractId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Schedule ${scheduleId} not found on contract ${contractId}`,
      );
    }
    return row;
  }

  private async requireContractAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceContractRow> {
    const [row] = await this.db
      .select()
      .from(maintenance_contracts)
      .where(
        and(
          eq(maintenance_contracts.id, id),
          isNull(maintenance_contracts.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Maintenance contract ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'maintenance contract',
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
        'Serial number product must match the contract item product',
      );
    }
  }

  private async ensureTechnicianInOrg(
    technicianId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: technicians.id,
        organization_id: technicians.organization_id,
      })
      .from(technicians)
      .where(
        and(eq(technicians.id, technicianId), isNull(technicians.deleted_at)),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Technician ${technicianId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Technician must belong to the same organization',
      );
    }
  }
}
