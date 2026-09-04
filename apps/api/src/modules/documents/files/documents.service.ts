import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, isNull, like, max, ne, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  document_types,
  document_versions,
  documents,
  organizations,
} from '../../../database/schema';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { parseAllowedMimeTypes } from '../document-types/document-types.mapper';
import {
  STORAGE_SERVICE,
  type StorageService,
} from '../storage/storage.types';
import {
  buildStorageKey,
  sanitizeFileName,
  sha256Hex,
} from '../storage/storage-path.utils';
import type { DocumentResponseDto } from './dto/document-response.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import {
  toDocumentResponse,
  toDocumentVersionResponse,
  type DocumentRow,
  type DocumentVersionRow,
} from './documents.mapper';
import type { DocumentVersionResponseDto } from './dto/document-response.dto';

export type UploadedFileInput = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async findAll(
    query: ListDocumentsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<DocumentResponseDto>> {
    const {
      page,
      pageSize,
      search,
      status,
      documentTypeId,
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
      documentTypeId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(documents).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(documents)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(documents.created_at))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as DocumentRow[]).map(toDocumentResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DocumentResponseDto> {
    const row = await this.findActiveRowById(id);
    this.assertOrgAccess(row.organization_id, currentOrganizationId, user);
    return toDocumentResponse(row);
  }

  async listVersions(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DocumentVersionResponseDto[]> {
    const doc = await this.findActiveRowById(id);
    this.assertOrgAccess(doc.organization_id, currentOrganizationId, user);

    const rows = await this.db
      .select()
      .from(document_versions)
      .where(eq(document_versions.document_id, id))
      .orderBy(desc(document_versions.version_number));

    return (rows as DocumentVersionRow[]).map(toDocumentVersionResponse);
  }

  async upload(
    file: UploadedFileInput | undefined,
    title: string,
    documentTypeId: string | undefined,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DocumentResponseDto> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    if (!title?.trim()) {
      throw new BadRequestException('title is required');
    }

    const organizationId = this.requireScopeOrgId(
      undefined,
      currentOrganizationId,
      user,
    );
    await this.ensureOrganizationExists(organizationId);
    await this.assertMimeAllowed(documentTypeId, file.mimetype, organizationId);

    const fileName = sanitizeFileName(file.originalname);
    const key = buildStorageKey(organizationId, fileName);
    const checksum = sha256Hex(file.buffer);

    await this.storage.put(key, file.buffer, {
      contentType: file.mimetype,
      originalFileName: fileName,
    });

    const id = createId();
    const versionId = createId();

    try {
      await this.db.insert(documents).values({
        id,
        organization_id: organizationId,
        document_type_id: documentTypeId ?? null,
        title: title.trim(),
        file_name: fileName,
        file_url: key,
        mime_type: file.mimetype || null,
        file_size: file.size,
        uploaded_by: user?.id ?? null,
        checksum,
        status: 'active',
      });

      await this.db.insert(document_versions).values({
        id: versionId,
        document_id: id,
        version_number: 1,
        file_url: key,
        change_notes: 'Initial upload',
        created_by: user?.id ?? null,
      });
    } catch (error) {
      await this.storage.delete(key).catch(() => undefined);
      throw error;
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async uploadVersion(
    id: string,
    file: UploadedFileInput | undefined,
    changeNotes: string | undefined,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DocumentResponseDto> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }

    const existing = await this.findActiveRowById(id);
    this.assertOrgAccess(existing.organization_id, currentOrganizationId, user);

    if (existing.status === 'deleted') {
      throw new BadRequestException('Cannot version a deleted document');
    }

    await this.assertMimeAllowed(
      existing.document_type_id ?? undefined,
      file.mimetype,
      existing.organization_id,
    );

    const fileName = sanitizeFileName(file.originalname);
    const key = buildStorageKey(existing.organization_id, fileName);
    const checksum = sha256Hex(file.buffer);

    await this.storage.put(key, file.buffer, {
      contentType: file.mimetype,
      originalFileName: fileName,
    });

    const [agg] = await this.db
      .select({ latest: max(document_versions.version_number) })
      .from(document_versions)
      .where(eq(document_versions.document_id, id));

    const nextVersion = Number(agg?.latest ?? 0) + 1;

    try {
      await this.db.insert(document_versions).values({
        id: createId(),
        document_id: id,
        version_number: nextVersion,
        file_url: key,
        change_notes: changeNotes?.trim() || null,
        created_by: user?.id ?? null,
      });

      await this.db
        .update(documents)
        .set({
          file_name: fileName,
          file_url: key,
          mime_type: file.mimetype || null,
          file_size: file.size,
          checksum,
          updated_at: nowMysqlDateTime(),
        })
        .where(eq(documents.id, id));
    } catch (error) {
      await this.storage.delete(key).catch(() => undefined);
      throw error;
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateDocumentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DocumentResponseDto> {
    const existing = await this.findActiveRowById(id);
    this.assertOrgAccess(existing.organization_id, currentOrganizationId, user);

    const patch: Partial<{
      title: string;
      status: 'active' | 'archived';
      updated_at: string;
      deleted_at: string | null;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.status !== undefined) {
      patch.status = dto.status;
      if (dto.status === 'active' || dto.status === 'archived') {
        patch.deleted_at = null;
      }
    }

    await this.db.update(documents).set(patch).where(eq(documents.id, id));
    return this.findOne(id, currentOrganizationId, user);
  }

  async softDelete(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.findActiveRowById(id);
    this.assertOrgAccess(existing.organization_id, currentOrganizationId, user);

    await this.db
      .update(documents)
      .set({
        status: 'deleted',
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(documents.id, id));
  }

  async openDownload(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<{
    stream: NodeJS.ReadableStream;
    fileName: string;
    mimeType: string;
    fileSize: number | null;
  }> {
    const row = await this.findActiveRowById(id);
    this.assertOrgAccess(row.organization_id, currentOrganizationId, user);

    if (row.status === 'deleted') {
      throw new NotFoundException(`Document ${id} not found`);
    }

    const stream = await this.storage.getStream(row.file_url);
    return {
      stream,
      fileName: row.file_name,
      mimeType: row.mime_type || 'application/octet-stream',
      fileSize: row.file_size,
    };
  }

  private async assertMimeAllowed(
    documentTypeId: string | undefined,
    mimeType: string,
    organizationId: string,
  ): Promise<void> {
    if (!documentTypeId) {
      return;
    }

    const [typeRow] = await this.db
      .select()
      .from(document_types)
      .where(eq(document_types.id, documentTypeId))
      .limit(1);

    if (!typeRow) {
      throw new NotFoundException(`Document type ${documentTypeId} not found`);
    }

    if (
      typeRow.organization_id !== null &&
      typeRow.organization_id !== organizationId
    ) {
      throw new ForbiddenException(
        'Document type is not available for this organization',
      );
    }

    const allowed = parseAllowedMimeTypes(typeRow.allowed_mime_types);
    if (!allowed?.length) {
      return;
    }
    if (!allowed.includes(mimeType)) {
      throw new BadRequestException(
        `MIME type ${mimeType} is not allowed for document type ${typeRow.code}`,
      );
    }
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
        'Cannot access documents of another organization',
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
        'Cannot access a document in another organization',
      );
    }
  }

  private async findActiveRowById(id: string): Promise<DocumentRow> {
    const [row] = await this.db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), ne(documents.status, 'deleted')))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    return row as DocumentRow;
  }

  private async ensureOrganizationExists(organizationId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        and(eq(organizations.id, organizationId), isNull(organizations.deleted_at)),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    status?: string;
    documentTypeId?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(documents.organization_id, params.organizationId),
    ];

    if (params.status) {
      parts.push(eq(documents.status, params.status as DocumentRow['status']));
    } else {
      parts.push(ne(documents.status, 'deleted'));
    }

    if (params.documentTypeId) {
      parts.push(eq(documents.document_type_id, params.documentTypeId));
    }

    if (params.search) {
      parts.push(
        or(
          like(documents.title, `%${params.search}%`),
          like(documents.file_name, `%${params.search}%`),
        )!,
      );
    }

    return and(...parts)!;
  }
}
