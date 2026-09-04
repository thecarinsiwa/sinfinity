import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, isNull, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  contract_items,
  contracts,
  documents,
  organizations,
} from '../../../database/schema';
import {
  throwFkOrRethrow,
  isMysqlDuplicateError,
} from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  toContractItemResponse,
  toContractResponse,
  type ContractItemRow,
  type ContractRow,
} from './contracts.mapper';
import {
  CreateContractItemDto,
  UpdateContractItemDto,
  type ContractItemResponseDto,
  type ContractStatus,
} from './dto/contract-item.dto';
import { ContractResponseDto } from './dto/contract-response.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { ListContractsQueryDto } from './dto/list-contracts-query.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListContractsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<ContractResponseDto>> {
    const {
      page,
      pageSize,
      search,
      status,
      customerId,
      supplierId,
      organizationId,
    } = query;
    const scopeOrgId = this.requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      status,
      customerId,
      supplierId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(contracts).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(contracts)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(contracts.created_at))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ContractRow[]).map((row) => toContractResponse(row)),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ContractResponseDto> {
    const row = await this.findActiveRowById(id);
    this.assertOrgAccess(row.organization_id, currentOrganizationId, user);
    const items = await this.loadItems(id);
    return toContractResponse(row, items);
  }

  async create(
    dto: CreateContractDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ContractResponseDto> {
    const organizationId = this.requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
    );
    this.assertParty(dto.customerId, dto.supplierId);
    await this.ensureOrganizationExists(organizationId);
    await this.assertDocumentInOrg(dto.documentId, organizationId);

    const id = createId();
    try {
      await this.db.insert(contracts).values({
        id,
        organization_id: organizationId,
        contract_number: dto.contractNumber.trim(),
        customer_id: dto.customerId ?? null,
        supplier_id: dto.supplierId ?? null,
        title: dto.title.trim(),
        start_date: dto.startDate ?? null,
        end_date: dto.endDate ?? null,
        status: dto.status ?? 'draft',
        document_id: dto.documentId ?? null,
        total_value: dto.totalValue ?? null,
        currency_id: dto.currencyId ?? null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          'Contract number already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid customer, supplier, document or currency reference',
      );
    }

    if (dto.items?.length) {
      for (const item of dto.items) {
        await this.insertItem(id, item);
      }
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateContractDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ContractResponseDto> {
    const existing = await this.findActiveRowById(id);
    this.assertOrgAccess(existing.organization_id, currentOrganizationId, user);

    if (dto.organizationId !== undefined) {
      this.assertOrgAccess(dto.organizationId, currentOrganizationId, user);
      await this.ensureOrganizationExists(dto.organizationId);
    }

    const nextCustomer =
      dto.customerId !== undefined ? dto.customerId : existing.customer_id;
    const nextSupplier =
      dto.supplierId !== undefined ? dto.supplierId : existing.supplier_id;
    this.assertParty(nextCustomer, nextSupplier);

    const orgForDoc =
      dto.organizationId ?? existing.organization_id;
    if (dto.documentId !== undefined) {
      await this.assertDocumentInOrg(dto.documentId, orgForDoc);
    }

    const patch: Partial<{
      organization_id: string;
      contract_number: string;
      customer_id: string | null;
      supplier_id: string | null;
      title: string;
      start_date: string | null;
      end_date: string | null;
      status: ContractStatus;
      document_id: string | null;
      total_value: string | null;
      currency_id: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.organizationId !== undefined)
      patch.organization_id = dto.organizationId;
    if (dto.contractNumber !== undefined)
      patch.contract_number = dto.contractNumber.trim();
    if (dto.customerId !== undefined) patch.customer_id = dto.customerId;
    if (dto.supplierId !== undefined) patch.supplier_id = dto.supplierId;
    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.startDate !== undefined) patch.start_date = dto.startDate;
    if (dto.endDate !== undefined) patch.end_date = dto.endDate;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.documentId !== undefined) patch.document_id = dto.documentId;
    if (dto.totalValue !== undefined) patch.total_value = dto.totalValue;
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;

    try {
      await this.db.update(contracts).set(patch).where(eq(contracts.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          'Contract number already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid customer, supplier, document or currency reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.findActiveRowById(id);
    this.assertOrgAccess(existing.organization_id, currentOrganizationId, user);

    await this.db
      .update(contracts)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(contracts.id, id));
  }

  async listItems(
    contractId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ContractItemResponseDto[]> {
    await this.requireContractAccess(contractId, currentOrganizationId, user);
    const items = await this.loadItems(contractId);
    return items.map(toContractItemResponse);
  }

  async addItem(
    contractId: string,
    dto: CreateContractItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ContractItemResponseDto> {
    await this.requireContractAccess(contractId, currentOrganizationId, user);
    const itemId = await this.insertItem(contractId, dto);
    return this.findItemById(contractId, itemId);
  }

  async updateItem(
    contractId: string,
    itemId: string,
    dto: UpdateContractItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ContractItemResponseDto> {
    await this.requireContractAccess(contractId, currentOrganizationId, user);
    await this.findItemRow(contractId, itemId);

    const patch: Partial<{
      product_id: string | null;
      service_id: string | null;
      description: string | null;
      quantity: string | null;
      unit_price: string | null;
      notes: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.productId !== undefined) patch.product_id = dto.productId;
    if (dto.serviceId !== undefined) patch.service_id = dto.serviceId;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.quantity !== undefined) patch.quantity = dto.quantity;
    if (dto.unitPrice !== undefined) patch.unit_price = dto.unitPrice;
    if (dto.notes !== undefined) patch.notes = dto.notes;

    try {
      await this.db
        .update(contract_items)
        .set(patch)
        .where(eq(contract_items.id, itemId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid product or service reference');
    }

    return this.findItemById(contractId, itemId);
  }

  async removeItem(
    contractId: string,
    itemId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireContractAccess(contractId, currentOrganizationId, user);
    await this.findItemRow(contractId, itemId);
    await this.db
      .delete(contract_items)
      .where(eq(contract_items.id, itemId));
  }

  private async insertItem(
    contractId: string,
    dto: CreateContractItemDto,
  ): Promise<string> {
    const id = createId();
    try {
      await this.db.insert(contract_items).values({
        id,
        contract_id: contractId,
        product_id: dto.productId ?? null,
        service_id: dto.serviceId ?? null,
        description: dto.description ?? null,
        quantity: dto.quantity ?? null,
        unit_price: dto.unitPrice ?? null,
        notes: dto.notes ?? null,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid product or service reference');
    }
    return id;
  }

  private async loadItems(contractId: string): Promise<ContractItemRow[]> {
    const rows = await this.db
      .select()
      .from(contract_items)
      .where(eq(contract_items.contract_id, contractId))
      .orderBy(contract_items.created_at);
    return rows as ContractItemRow[];
  }

  private async findItemById(
    contractId: string,
    itemId: string,
  ): Promise<ContractItemResponseDto> {
    const row = await this.findItemRow(contractId, itemId);
    return toContractItemResponse(row);
  }

  private async findItemRow(
    contractId: string,
    itemId: string,
  ): Promise<ContractItemRow> {
    const [row] = await this.db
      .select()
      .from(contract_items)
      .where(
        and(
          eq(contract_items.id, itemId),
          eq(contract_items.contract_id, contractId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Contract item ${itemId} not found`);
    }
    return row as ContractItemRow;
  }

  private async requireContractAccess(
    contractId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ContractRow> {
    const row = await this.findActiveRowById(contractId);
    this.assertOrgAccess(row.organization_id, currentOrganizationId, user);
    return row;
  }

  private assertParty(
    customerId: string | null | undefined,
    supplierId: string | null | undefined,
  ): void {
    if (!customerId && !supplierId) {
      throw new BadRequestException(
        'At least one of customerId or supplierId is required',
      );
    }
  }

  private async assertDocumentInOrg(
    documentId: string | null | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!documentId) {
      return;
    }
    const [row] = await this.db
      .select({
        id: documents.id,
        organization_id: documents.organization_id,
        status: documents.status,
      })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!row || row.status === 'deleted') {
      throw new NotFoundException(`Document ${documentId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'documentId must belong to the same organization',
      );
    }
  }

  private requireOrgId(
    dtoOrgId: string | undefined,
    currentOrganizationId: string | undefined,
    user?: AuthUser,
  ): string {
    if (user?.isSuperAdmin && dtoOrgId) {
      return dtoOrgId;
    }
    const organizationId =
      dtoOrgId ?? currentOrganizationId ?? user?.organizationId;
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    if (
      user &&
      !user.isSuperAdmin &&
      dtoOrgId &&
      dtoOrgId !== user.organizationId
    ) {
      throw new ForbiddenException(
        'Cannot create a contract in another organization',
      );
    }
    return organizationId;
  }

  private requireScopeOrgId(
    queryOrgId: string | undefined,
    currentOrganizationId: string | undefined,
    user?: AuthUser,
  ): string {
    if (user?.isSuperAdmin) {
      const organizationId =
        queryOrgId ?? currentOrganizationId ?? user.organizationId;
      if (!organizationId) {
        throw new BadRequestException('organizationId is required');
      }
      return organizationId;
    }
    const organizationId =
      currentOrganizationId ?? user?.organizationId ?? queryOrgId;
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    if (queryOrgId && queryOrgId !== organizationId) {
      throw new ForbiddenException(
        'Cannot access contracts of another organization',
      );
    }
    return organizationId;
  }

  private assertOrgAccess(
    organizationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): void {
    if (!user || user.isSuperAdmin) {
      return;
    }
    const scope = currentOrganizationId ?? user.organizationId;
    if (scope && scope !== organizationId) {
      throw new ForbiddenException(
        'Cannot access a contract in another organization',
      );
    }
  }

  private async findActiveRowById(id: string): Promise<ContractRow> {
    const [row] = await this.db
      .select()
      .from(contracts)
      .where(and(eq(contracts.id, id), isNull(contracts.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Contract ${id} not found`);
    }
    return row as ContractRow;
  }

  private async ensureOrganizationExists(organizationId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        and(
          eq(organizations.id, organizationId),
          isNull(organizations.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    status?: ContractStatus;
    customerId?: string;
    supplierId?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(contracts.organization_id, params.organizationId),
      isNull(contracts.deleted_at),
    ];

    if (params.status) {
      parts.push(eq(contracts.status, params.status));
    }
    if (params.customerId) {
      parts.push(eq(contracts.customer_id, params.customerId));
    }
    if (params.supplierId) {
      parts.push(eq(contracts.supplier_id, params.supplierId));
    }
    if (params.search) {
      parts.push(
        or(
          like(contracts.contract_number, `%${params.search}%`),
          like(contracts.title, `%${params.search}%`),
        )!,
      );
    }

    return and(...parts)!;
  }
}
