import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ErrorResponseDto,
  JwtAuthGuard,
  OrganizationId,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import {
  CreateSalesOrderDocumentDto,
  SalesOrderDocumentResponseDto,
  UpdateSalesOrderDocumentDto,
} from './dto/sales-order-document.dto';
import { SalesOrderDocumentsService } from './sales-order-documents.service';

@ApiTags(SWAGGER_TAG.CommandesClients)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales-orders/:orderId/documents')
export class SalesOrderDocumentsController {
  constructor(
    private readonly salesOrderDocumentsService: SalesOrderDocumentsService,
  ) {}

  @Get()
  @RequirePermissions('sales_orders.read')
  @ApiOperation({
    summary: 'List sales order documents',
    description:
      'Dedicated sales_order_documents links (complementary to polymorphic document_links).',
  })
  @ApiOkResponse({ type: [SalesOrderDocumentResponseDto] })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  list(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesOrderDocumentResponseDto[]> {
    return this.salesOrderDocumentsService.list(
      orderId,
      organizationId,
      user,
    );
  }

  @Post()
  @RequirePermissions('sales_orders.write')
  @ApiOperation({
    summary: 'Link a document to a sales order',
    description:
      'Document must exist, same org, not soft-deleted. docKind: purchase_order|contract|other.',
  })
  @ApiCreatedResponse({ type: SalesOrderDocumentResponseDto })
  create(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CreateSalesOrderDocumentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesOrderDocumentResponseDto> {
    return this.salesOrderDocumentsService.create(
      orderId,
      dto,
      organizationId,
      user,
    );
  }

  @Patch(':documentLinkId')
  @RequirePermissions('sales_orders.write')
  @ApiOperation({ summary: 'Update a sales order document link' })
  @ApiOkResponse({ type: SalesOrderDocumentResponseDto })
  update(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('documentLinkId', ParseUUIDPipe) documentLinkId: string,
    @Body() dto: UpdateSalesOrderDocumentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesOrderDocumentResponseDto> {
    return this.salesOrderDocumentsService.update(
      orderId,
      documentLinkId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':documentLinkId')
  @RequirePermissions('sales_orders.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a sales order document link' })
  @ApiNoContentResponse()
  remove(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('documentLinkId', ParseUUIDPipe) documentLinkId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.salesOrderDocumentsService.remove(
      orderId,
      documentLinkId,
      organizationId,
      user,
    );
  }
}
