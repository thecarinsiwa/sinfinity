import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { createId, type AuthUser } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  documents,
  import_documents,
  shipments,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { assertOrgAccess } from '../logistics-scope';
import {
  CreateImportDocumentDto,
  ImportDocumentResponseDto,
  UpdateImportDocumentDto,
} from './dto/customs.dto';
import {
  toImportDocumentResponse,
  type ImportDocumentRow,
} from './customs.mapper';

@Injectable()
export class ImportDocumentsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async list(
    shipmentId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ImportDocumentResponseDto[]> {
    const shipment = await this.requireShipmentInScope(
      shipmentId,
      currentOrganizationId,
      user,
    );
    const rows = await this.db
      .select()
      .from(import_documents)
      .where(eq(import_documents.shipment_id, shipment.id))
      .orderBy(desc(import_documents.created_at), asc(import_documents.id));
    return (rows as ImportDocumentRow[]).map(toImportDocumentResponse);
  }

  async create(
    shipmentId: string,
    dto: CreateImportDocumentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ImportDocumentResponseDto> {
    const shipment = await this.requireShipmentInScope(
      shipmentId,
      currentOrganizationId,
      user,
    );
    await this.requireDocumentInOrg(
      dto.documentId,
      shipment.organization_id,
    );

    const id = createId();
    try {
      await this.db.insert(import_documents).values({
        id,
        shipment_id: shipmentId,
        document_id: dto.documentId,
        doc_kind: dto.docKind ?? null,
        created_at: nowMysqlDateTime(),
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid document or shipment reference');
    }

    return this.requireRow(shipmentId, id, currentOrganizationId, user);
  }

  async update(
    shipmentId: string,
    linkId: string,
    dto: UpdateImportDocumentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ImportDocumentResponseDto> {
    await this.requireRow(shipmentId, linkId, currentOrganizationId, user);
    if (dto.docKind !== undefined) {
      await this.db
        .update(import_documents)
        .set({ doc_kind: dto.docKind })
        .where(eq(import_documents.id, linkId));
    }
    return this.requireRow(shipmentId, linkId, currentOrganizationId, user);
  }

  async remove(
    shipmentId: string,
    linkId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireRow(shipmentId, linkId, currentOrganizationId, user);
    await this.db
      .delete(import_documents)
      .where(eq(import_documents.id, linkId));
  }

  private async requireRow(
    shipmentId: string,
    linkId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ImportDocumentResponseDto> {
    await this.requireShipmentInScope(
      shipmentId,
      currentOrganizationId,
      user,
    );
    const [row] = await this.db
      .select()
      .from(import_documents)
      .where(
        and(
          eq(import_documents.id, linkId),
          eq(import_documents.shipment_id, shipmentId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Import document ${linkId} not found`);
    }
    return toImportDocumentResponse(row as ImportDocumentRow);
  }

  private async requireShipmentInScope(
    shipmentId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<{ id: string; organization_id: string }> {
    const [row] = await this.db
      .select({
        id: shipments.id,
        organization_id: shipments.organization_id,
      })
      .from(shipments)
      .where(and(eq(shipments.id, shipmentId), isNull(shipments.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Shipment ${shipmentId} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'shipment',
    );
    return row;
  }

  private async requireDocumentInOrg(
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
        'Document must belong to the same organization as the shipment',
      );
    }
  }
}
