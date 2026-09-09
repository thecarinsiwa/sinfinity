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
  customs_declarations,
  customs_documents,
  documents,
  shipments,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { formatDecimal } from '../../purchase-orders/purchase-orders-totals';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../logistics-scope';
import {
  CreateCustomsDeclarationDto,
  CreateCustomsDocumentDto,
  CustomsDeclarationResponseDto,
  CustomsDocumentResponseDto,
  ListCustomsDeclarationsQueryDto,
  UpdateCustomsDeclarationDto,
  UpdateCustomsDocumentDto,
  type CustomsDeclarationStatus,
} from './dto/customs.dto';
import {
  toCustomsDeclarationResponse,
  toCustomsDocumentResponse,
  type CustomsDeclarationRow,
  type CustomsDocumentRow,
} from './customs.mapper';

function toMysqlDateTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace('T', ' ').replace('Z', '');
}

@Injectable()
export class CustomsDeclarationsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListCustomsDeclarationsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<CustomsDeclarationResponseDto>> {
    const { page, pageSize, organizationId, search, status, shipmentId } =
      query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      status,
      shipmentId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(customs_declarations).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(customs_declarations)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(customs_declarations.created_at), asc(customs_declarations.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as CustomsDeclarationRow[]).map(toCustomsDeclarationResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomsDeclarationResponseDto> {
    const row = await this.requireDeclarationAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toCustomsDeclarationResponse(row);
  }

  async create(
    dto: CreateCustomsDeclarationDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomsDeclarationResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'customs declaration',
    );
    await ensureOrganizationExists(this.db, organizationId);
    if (dto.shipmentId) {
      await this.ensureShipmentInOrg(dto.shipmentId, organizationId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    const status = dto.status ?? 'draft';
    let clearedAt = toMysqlDateTime(dto.clearedAt);
    if (status === 'cleared' && clearedAt == null) {
      clearedAt = now;
    }

    try {
      await this.db.insert(customs_declarations).values({
        id,
        organization_id: organizationId,
        shipment_id: dto.shipmentId ?? null,
        declaration_number: dto.declarationNumber ?? null,
        regime: dto.regime ?? null,
        declared_value:
          dto.declaredValue == null
            ? null
            : formatDecimal(Number(dto.declaredValue)),
        currency_id: dto.currencyId ?? null,
        status,
        cleared_at: clearedAt,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid shipment or currency reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateCustomsDeclarationDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomsDeclarationResponseDto> {
    const existing = await this.requireDeclarationAccess(
      id,
      currentOrganizationId,
      user,
    );

    if (dto.shipmentId) {
      await this.ensureShipmentInOrg(
        dto.shipmentId,
        existing.organization_id,
      );
    }

    const patch: Record<string, unknown> = {
      updated_at: nowMysqlDateTime(),
    };
    if (dto.shipmentId !== undefined) patch.shipment_id = dto.shipmentId;
    if (dto.declarationNumber !== undefined) {
      patch.declaration_number = dto.declarationNumber;
    }
    if (dto.regime !== undefined) patch.regime = dto.regime;
    if (dto.declaredValue !== undefined) {
      patch.declared_value =
        dto.declaredValue == null
          ? null
          : formatDecimal(Number(dto.declaredValue));
    }
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.status !== undefined) {
      patch.status = dto.status;
      if (dto.status === 'cleared' && dto.clearedAt === undefined) {
        patch.cleared_at = existing.cleared_at ?? nowMysqlDateTime();
      }
    }
    if (dto.clearedAt !== undefined) {
      patch.cleared_at = toMysqlDateTime(dto.clearedAt);
    }

    try {
      await this.db
        .update(customs_declarations)
        .set(patch)
        .where(eq(customs_declarations.id, id));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid shipment or currency reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireDeclarationAccess(id, currentOrganizationId, user);
    await this.db
      .update(customs_declarations)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(customs_declarations.id, id));
  }

  // --- Nested customs documents ---

  async listDocuments(
    declarationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomsDocumentResponseDto[]> {
    const declaration = await this.requireDeclarationAccess(
      declarationId,
      currentOrganizationId,
      user,
    );
    const rows = await this.db
      .select()
      .from(customs_documents)
      .where(eq(customs_documents.customs_declaration_id, declaration.id))
      .orderBy(desc(customs_documents.created_at), asc(customs_documents.id));
    return (rows as CustomsDocumentRow[]).map(toCustomsDocumentResponse);
  }

  async addDocument(
    declarationId: string,
    dto: CreateCustomsDocumentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomsDocumentResponseDto> {
    const declaration = await this.requireDeclarationAccess(
      declarationId,
      currentOrganizationId,
      user,
    );
    await this.requireDocumentInOrg(
      dto.documentId,
      declaration.organization_id,
    );

    const id = createId();
    try {
      await this.db.insert(customs_documents).values({
        id,
        customs_declaration_id: declarationId,
        document_id: dto.documentId,
        doc_kind: dto.docKind ?? null,
        created_at: nowMysqlDateTime(),
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid document or customs declaration');
    }

    return this.requireDocumentRow(declarationId, id);
  }

  async updateDocument(
    declarationId: string,
    linkId: string,
    dto: UpdateCustomsDocumentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomsDocumentResponseDto> {
    await this.requireDocumentRow(
      declarationId,
      linkId,
      currentOrganizationId,
      user,
    );
    if (dto.docKind !== undefined) {
      await this.db
        .update(customs_documents)
        .set({ doc_kind: dto.docKind })
        .where(eq(customs_documents.id, linkId));
    }
    return this.requireDocumentRow(declarationId, linkId);
  }

  async removeDocument(
    declarationId: string,
    linkId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireDocumentRow(
      declarationId,
      linkId,
      currentOrganizationId,
      user,
    );
    await this.db
      .delete(customs_documents)
      .where(eq(customs_documents.id, linkId));
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    status?: CustomsDeclarationStatus;
    shipmentId?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(customs_declarations.organization_id, params.organizationId),
      isNull(customs_declarations.deleted_at),
    ];
    if (params.status) {
      parts.push(eq(customs_declarations.status, params.status));
    }
    if (params.shipmentId) {
      parts.push(eq(customs_declarations.shipment_id, params.shipmentId));
    }
    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      parts.push(like(customs_declarations.declaration_number, term));
    }
    return and(...parts)!;
  }

  private async requireDeclarationAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomsDeclarationRow> {
    const [row] = await this.db
      .select()
      .from(customs_declarations)
      .where(
        and(
          eq(customs_declarations.id, id),
          isNull(customs_declarations.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Customs declaration ${id} not found`);
    }
    assertOrgAccess(
      (row as CustomsDeclarationRow).organization_id,
      currentOrganizationId,
      user,
      'customs declaration',
    );
    return row as CustomsDeclarationRow;
  }

  private async requireDocumentRow(
    declarationId: string,
    linkId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomsDocumentResponseDto> {
    await this.requireDeclarationAccess(
      declarationId,
      currentOrganizationId,
      user,
    );
    const [row] = await this.db
      .select()
      .from(customs_documents)
      .where(
        and(
          eq(customs_documents.id, linkId),
          eq(customs_documents.customs_declaration_id, declarationId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Customs document ${linkId} not found`);
    }
    return toCustomsDocumentResponse(row as CustomsDocumentRow);
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

  async requireDocumentInOrg(
    documentId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: documents.id,
        organization_id: documents.organization_id,
        status: documents.status,
        deleted_at: documents.deleted_at,
      })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!row || row.deleted_at != null || row.status === 'deleted') {
      throw new NotFoundException(`Document ${documentId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Document must belong to the same organization',
      );
    }
  }
}
