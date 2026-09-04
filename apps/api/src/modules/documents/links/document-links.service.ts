import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, ne, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { document_links, documents } from '../../../database/schema';
import { throwDuplicateOrRethrow } from '../../settings/utils/mysql-errors';
import {
  isAllowedDocumentLinkEntityType,
  isAllowedDocumentLinkRole,
} from './document-links.catalog';
import {
  toDocumentLinkResponse,
  type DocumentLinkJoinRow,
} from './document-links.mapper';
import { CreateDocumentLinkDto } from './dto/create-document-link.dto';
import { DocumentLinkResponseDto } from './dto/document-link-response.dto';
import { ListDocumentLinksQueryDto } from './dto/list-document-links-query.dto';

@Injectable()
export class DocumentLinksService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByEntity(
    query: ListDocumentLinksQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<DocumentLinkResponseDto>> {
    this.assertEntityType(query.entityType);
    if (query.role !== undefined) {
      this.assertRole(query.role);
    }

    const scopeOrgId = this.requireScopeOrgId(
      query.organizationId,
      currentOrganizationId,
      user,
    );
    const { page, pageSize, entityType, entityId, role } = query;
    const offset = (page - 1) * pageSize;

    const where = this.buildWhere({
      organizationId: scopeOrgId,
      entityType,
      entityId,
      role,
    });

    const listQuery = this.db
      .select({
        id: document_links.id,
        document_id: document_links.document_id,
        entity_type: document_links.entity_type,
        entity_id: document_links.entity_id,
        role: document_links.role,
        created_at: document_links.created_at,
        document_title: documents.title,
        document_file_name: documents.file_name,
        document_status: documents.status,
        document_mime_type: documents.mime_type,
      })
      .from(document_links)
      .innerJoin(documents, eq(document_links.document_id, documents.id))
      .$dynamic();

    const countQuery = this.db
      .select({ total: count() })
      .from(document_links)
      .innerJoin(documents, eq(document_links.document_id, documents.id))
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(document_links.created_at))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as DocumentLinkJoinRow[]).map(toDocumentLinkResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async create(
    dto: CreateDocumentLinkDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DocumentLinkResponseDto> {
    this.assertEntityType(dto.entityType);
    if (dto.role !== undefined) {
      this.assertRole(dto.role);
    }

    const scopeOrgId = this.requireScopeOrgId(
      undefined,
      currentOrganizationId,
      user,
    );

    const [doc] = await this.db
      .select()
      .from(documents)
      .where(eq(documents.id, dto.documentId))
      .limit(1);

    if (!doc || doc.status === 'deleted' || doc.deleted_at) {
      throw new NotFoundException(`Document ${dto.documentId} not found`);
    }
    this.assertOrgAccess(doc.organization_id, scopeOrgId, user);

    const id = createId();
    try {
      await this.db.insert(document_links).values({
        id,
        document_id: dto.documentId,
        entity_type: dto.entityType,
        entity_id: dto.entityId,
        role: dto.role ?? null,
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Document is already linked to this entity',
      );
    }

    return this.findOneById(id, scopeOrgId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const scopeOrgId = this.requireScopeOrgId(
      undefined,
      currentOrganizationId,
      user,
    );

    const [row] = await this.db
      .select({
        linkId: document_links.id,
        organizationId: documents.organization_id,
        documentStatus: documents.status,
      })
      .from(document_links)
      .innerJoin(documents, eq(document_links.document_id, documents.id))
      .where(eq(document_links.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Document link ${id} not found`);
    }

    this.assertOrgAccess(row.organizationId, scopeOrgId, user);

    await this.db.delete(document_links).where(eq(document_links.id, id));
  }

  private async findOneById(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DocumentLinkResponseDto> {
    const [row] = await this.db
      .select({
        id: document_links.id,
        document_id: document_links.document_id,
        entity_type: document_links.entity_type,
        entity_id: document_links.entity_id,
        role: document_links.role,
        created_at: document_links.created_at,
        document_title: documents.title,
        document_file_name: documents.file_name,
        document_status: documents.status,
        document_mime_type: documents.mime_type,
        organization_id: documents.organization_id,
      })
      .from(document_links)
      .innerJoin(documents, eq(document_links.document_id, documents.id))
      .where(eq(document_links.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Document link ${id} not found`);
    }

    this.assertOrgAccess(row.organization_id, currentOrganizationId, user);
    return toDocumentLinkResponse(row);
  }

  private buildWhere(params: {
    organizationId: string;
    entityType: string;
    entityId: string;
    role?: string;
  }): SQL | undefined {
    const parts: SQL[] = [
      eq(documents.organization_id, params.organizationId),
      ne(documents.status, 'deleted'),
      eq(document_links.entity_type, params.entityType),
      eq(document_links.entity_id, params.entityId),
    ];
    if (params.role) {
      parts.push(eq(document_links.role, params.role));
    }
    return and(...parts);
  }

  private assertEntityType(entityType: string): void {
    if (!isAllowedDocumentLinkEntityType(entityType)) {
      throw new BadRequestException(
        `entityType '${entityType}' is not allowed`,
      );
    }
  }

  private assertRole(role: string): void {
    if (!isAllowedDocumentLinkRole(role)) {
      throw new BadRequestException(`role '${role}' is not allowed`);
    }
  }

  private requireScopeOrgId(
    queryOrgId: string | undefined,
    currentOrganizationId: string | undefined,
    user: AuthUser | undefined,
  ): string {
    if (user?.isSuperAdmin) {
      const orgId = queryOrgId ?? currentOrganizationId;
      if (!orgId) {
        throw new BadRequestException(
          'organizationId is required for super-admin',
        );
      }
      return orgId;
    }
    if (!currentOrganizationId) {
      throw new ForbiddenException('Organization context required');
    }
    return currentOrganizationId;
  }

  private assertOrgAccess(
    documentOrgId: string,
    currentOrganizationId: string | undefined,
    user: AuthUser | undefined,
  ): void {
    if (user?.isSuperAdmin) {
      return;
    }
    if (!currentOrganizationId || documentOrgId !== currentOrganizationId) {
      throw new ForbiddenException('Document is outside your organization');
    }
  }
}
