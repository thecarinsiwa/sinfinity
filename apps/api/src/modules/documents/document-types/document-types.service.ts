import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, isNotNull, isNull, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { document_types, organizations } from '../../../database/schema';
import {
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { DocumentTypeResponseDto } from './dto/document-type-response.dto';
import { ListDocumentTypesQueryDto } from './dto/list-document-types-query.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';
import {
  toDocumentTypeResponse,
  type DocumentTypeRow,
} from './document-types.mapper';

@Injectable()
export class DocumentTypesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListDocumentTypesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<DocumentTypeResponseDto>> {
    const {
      page,
      pageSize,
      search,
      isSystem,
      includeSystem = true,
      organizationId,
    } = query;
    const scopeOrgId = this.resolveScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      isSystem,
      includeSystem,
      isSuperAdmin: user?.isSuperAdmin === true,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(document_types).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(document_types)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(document_types.code).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as DocumentTypeRow[]).map(toDocumentTypeResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DocumentTypeResponseDto> {
    const row = await this.findRowById(id);
    this.assertAccess(row, currentOrganizationId, user);
    return toDocumentTypeResponse(row);
  }

  async create(
    dto: CreateDocumentTypeDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DocumentTypeResponseDto> {
    const organizationId = this.requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
    );
    await this.ensureOrganizationExists(organizationId);

    const id = createId();
    try {
      await this.db.insert(document_types).values({
        id,
        organization_id: organizationId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name,
        allowed_mime_types: dto.allowedMimeTypes ?? null,
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Document type code already exists for this organization',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateDocumentTypeDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DocumentTypeResponseDto> {
    const existing = await this.findRowById(id);
    this.assertAccess(existing, currentOrganizationId, user);

    if (existing.organization_id === null && !user?.isSuperAdmin) {
      throw new ForbiddenException('System document types cannot be updated');
    }

    const patch: Partial<{
      name: string;
      allowed_mime_types: string[] | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.allowedMimeTypes !== undefined) {
      patch.allowed_mime_types = dto.allowedMimeTypes;
    }

    await this.db
      .update(document_types)
      .set(patch)
      .where(eq(document_types.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.findRowById(id);
    this.assertAccess(existing, currentOrganizationId, user);

    if (existing.organization_id === null) {
      throw new ForbiddenException('System document types cannot be deleted');
    }

    try {
      await this.db
        .delete(document_types)
        .where(eq(document_types.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Document type is referenced by documents and cannot be deleted',
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
        'Cannot create a document type in another organization',
      );
    }
    return organizationId;
  }

  private resolveScopeOrgId(
    queryOrgId: string | undefined,
    currentOrganizationId: string | undefined,
    user?: AuthUser,
  ): string | undefined {
    if (user?.isSuperAdmin) {
      return queryOrgId ?? currentOrganizationId;
    }
    return currentOrganizationId ?? user?.organizationId ?? queryOrgId;
  }

  private assertAccess(
    row: DocumentTypeRow,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): void {
    if (!user || user.isSuperAdmin) {
      return;
    }
    if (row.organization_id === null) {
      return;
    }
    const scope = currentOrganizationId ?? user.organizationId;
    if (scope && scope !== row.organization_id) {
      throw new ForbiddenException(
        'Cannot access a document type in another organization',
      );
    }
  }

  private async findRowById(id: string): Promise<DocumentTypeRow> {
    const [row] = await this.db
      .select()
      .from(document_types)
      .where(eq(document_types.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Document type ${id} not found`);
    }

    return row as DocumentTypeRow;
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
    organizationId?: string;
    search?: string;
    isSystem?: boolean;
    includeSystem: boolean;
    isSuperAdmin: boolean;
  }): SQL | undefined {
    const parts: SQL[] = [];

    if (params.isSystem === true) {
      parts.push(isNull(document_types.organization_id));
    } else if (params.isSystem === false) {
      if (params.organizationId) {
        parts.push(eq(document_types.organization_id, params.organizationId));
      } else {
        parts.push(isNotNull(document_types.organization_id));
      }
    } else if (params.organizationId) {
      if (params.includeSystem) {
        parts.push(
          or(
            eq(document_types.organization_id, params.organizationId),
            isNull(document_types.organization_id),
          )!,
        );
      } else {
        parts.push(eq(document_types.organization_id, params.organizationId));
      }
    } else if (!params.isSuperAdmin) {
      if (params.includeSystem) {
        parts.push(isNull(document_types.organization_id));
      } else {
        parts.push(eq(document_types.code, '__none__'));
      }
    }

    if (params.search) {
      parts.push(
        or(
          like(document_types.code, `%${params.search}%`),
          like(document_types.name, `%${params.search}%`),
        )!,
      );
    }

    return parts.length ? and(...parts) : undefined;
  }
}
