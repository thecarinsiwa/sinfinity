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
  supplier_documents,
  suppliers,
} from '../../../database/schema';
import { assertOrgAccess } from '../suppliers-scope';
import {
  CreateSupplierDocumentDto,
  SupplierDocumentResponseDto,
  UpdateSupplierDocumentDto,
} from './dto/supplier-document.dto';
import {
  toSupplierDocumentResponse,
  type SupplierDocumentRow,
} from './supplier-documents.mapper';

@Injectable()
export class SupplierDocumentsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async list(
    supplierId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierDocumentResponseDto[]> {
    await this.requireSupplierInScope(
      supplierId,
      currentOrganizationId,
      user,
    );
    const rows = await this.db
      .select({
        id: supplier_documents.id,
        supplier_id: supplier_documents.supplier_id,
        document_id: supplier_documents.document_id,
        doc_kind: supplier_documents.doc_kind,
        expires_at: supplier_documents.expires_at,
        created_at: supplier_documents.created_at,
      })
      .from(supplier_documents)
      .where(eq(supplier_documents.supplier_id, supplierId))
      .orderBy(desc(supplier_documents.created_at), asc(supplier_documents.id));

    return (rows as SupplierDocumentRow[]).map(toSupplierDocumentResponse);
  }

  async create(
    supplierId: string,
    dto: CreateSupplierDocumentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierDocumentResponseDto> {
    const supplier = await this.requireSupplierInScope(
      supplierId,
      currentOrganizationId,
      user,
    );
    await this.requireDocumentInOrg(dto.documentId, supplier.organization_id);

    const id = createId();
    await this.db.insert(supplier_documents).values({
      id,
      supplier_id: supplierId,
      document_id: dto.documentId,
      doc_kind: dto.docKind ?? null,
      expires_at:
        dto.expiresAt != null ? dto.expiresAt.slice(0, 10) : null,
    });

    return this.requireRow(supplierId, id, currentOrganizationId, user);
  }

  async update(
    supplierId: string,
    documentLinkId: string,
    dto: UpdateSupplierDocumentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierDocumentResponseDto> {
    await this.requireRow(
      supplierId,
      documentLinkId,
      currentOrganizationId,
      user,
    );

    const patch: Partial<{
      doc_kind: string | null;
      expires_at: string | null;
    }> = {};
    if (dto.docKind !== undefined) patch.doc_kind = dto.docKind;
    if (dto.expiresAt !== undefined) {
      patch.expires_at =
        dto.expiresAt != null ? dto.expiresAt.slice(0, 10) : null;
    }

    if (Object.keys(patch).length) {
      await this.db
        .update(supplier_documents)
        .set(patch)
        .where(eq(supplier_documents.id, documentLinkId));
    }

    return this.requireRow(
      supplierId,
      documentLinkId,
      currentOrganizationId,
      user,
    );
  }

  async remove(
    supplierId: string,
    documentLinkId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireRow(
      supplierId,
      documentLinkId,
      currentOrganizationId,
      user,
    );
    await this.db
      .delete(supplier_documents)
      .where(eq(supplier_documents.id, documentLinkId));
  }

  private async requireRow(
    supplierId: string,
    documentLinkId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierDocumentResponseDto> {
    await this.requireSupplierInScope(
      supplierId,
      currentOrganizationId,
      user,
    );
    const [row] = await this.db
      .select({
        id: supplier_documents.id,
        supplier_id: supplier_documents.supplier_id,
        document_id: supplier_documents.document_id,
        doc_kind: supplier_documents.doc_kind,
        expires_at: supplier_documents.expires_at,
        created_at: supplier_documents.created_at,
      })
      .from(supplier_documents)
      .where(
        and(
          eq(supplier_documents.id, documentLinkId),
          eq(supplier_documents.supplier_id, supplierId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        `Supplier document ${documentLinkId} not found`,
      );
    }
    return toSupplierDocumentResponse(row as SupplierDocumentRow);
  }

  private async requireSupplierInScope(
    supplierId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<{ id: string; organization_id: string }> {
    const [row] = await this.db
      .select({
        id: suppliers.id,
        organization_id: suppliers.organization_id,
      })
      .from(suppliers)
      .where(and(eq(suppliers.id, supplierId), isNull(suppliers.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'supplier',
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
        'Document must belong to the same organization as the supplier',
      );
    }
  }
}
