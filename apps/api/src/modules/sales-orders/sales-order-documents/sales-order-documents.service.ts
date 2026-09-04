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
  sales_order_documents,
  sales_orders,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { assertOrgAccess } from '../sales-orders-scope';
import {
  CreateSalesOrderDocumentDto,
  SalesOrderDocumentResponseDto,
  UpdateSalesOrderDocumentDto,
} from './dto/sales-order-document.dto';
import {
  toSalesOrderDocumentResponse,
  type SalesOrderDocumentRow,
} from './sales-order-documents.mapper';

@Injectable()
export class SalesOrderDocumentsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async list(
    orderId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderDocumentResponseDto[]> {
    await this.requireOrderInScope(orderId, currentOrganizationId, user);
    const rows = await this.db
      .select({
        id: sales_order_documents.id,
        sales_order_id: sales_order_documents.sales_order_id,
        document_id: sales_order_documents.document_id,
        doc_kind: sales_order_documents.doc_kind,
        created_at: sales_order_documents.created_at,
      })
      .from(sales_order_documents)
      .where(eq(sales_order_documents.sales_order_id, orderId))
      .orderBy(
        desc(sales_order_documents.created_at),
        asc(sales_order_documents.id),
      );
    return (rows as SalesOrderDocumentRow[]).map(toSalesOrderDocumentResponse);
  }

  async create(
    orderId: string,
    dto: CreateSalesOrderDocumentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderDocumentResponseDto> {
    const order = await this.requireOrderInScope(
      orderId,
      currentOrganizationId,
      user,
    );
    await this.requireDocumentInOrg(dto.documentId, order.organization_id);

    const id = createId();
    try {
      await this.db.insert(sales_order_documents).values({
        id,
        sales_order_id: orderId,
        document_id: dto.documentId,
        doc_kind: dto.docKind ?? null,
        created_at: nowMysqlDateTime(),
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid document or sales order reference');
    }

    return this.requireRow(orderId, id, currentOrganizationId, user);
  }

  async update(
    orderId: string,
    documentLinkId: string,
    dto: UpdateSalesOrderDocumentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderDocumentResponseDto> {
    await this.requireRow(
      orderId,
      documentLinkId,
      currentOrganizationId,
      user,
    );

    if (dto.docKind !== undefined) {
      await this.db
        .update(sales_order_documents)
        .set({ doc_kind: dto.docKind })
        .where(eq(sales_order_documents.id, documentLinkId));
    }

    return this.requireRow(
      orderId,
      documentLinkId,
      currentOrganizationId,
      user,
    );
  }

  async remove(
    orderId: string,
    documentLinkId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireRow(
      orderId,
      documentLinkId,
      currentOrganizationId,
      user,
    );
    await this.db
      .delete(sales_order_documents)
      .where(eq(sales_order_documents.id, documentLinkId));
  }

  private async requireRow(
    orderId: string,
    documentLinkId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderDocumentResponseDto> {
    await this.requireOrderInScope(orderId, currentOrganizationId, user);
    const [row] = await this.db
      .select({
        id: sales_order_documents.id,
        sales_order_id: sales_order_documents.sales_order_id,
        document_id: sales_order_documents.document_id,
        doc_kind: sales_order_documents.doc_kind,
        created_at: sales_order_documents.created_at,
      })
      .from(sales_order_documents)
      .where(
        and(
          eq(sales_order_documents.id, documentLinkId),
          eq(sales_order_documents.sales_order_id, orderId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Sales order document ${documentLinkId} not found`,
      );
    }
    return toSalesOrderDocumentResponse(row as SalesOrderDocumentRow);
  }

  private async requireOrderInScope(
    orderId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<{ id: string; organization_id: string }> {
    const [row] = await this.db
      .select({
        id: sales_orders.id,
        organization_id: sales_orders.organization_id,
      })
      .from(sales_orders)
      .where(
        and(eq(sales_orders.id, orderId), isNull(sales_orders.deleted_at)),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Sales order ${orderId} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'sales order',
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
        'Document must belong to the same organization as the sales order',
      );
    }
  }
}
