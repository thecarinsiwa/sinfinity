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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  CurrentUser,
  ErrorResponseDto,
  JwtAuthGuard,
  OrganizationId,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import {
  CreateInvoiceDto,
  CreateInvoiceFromSalesOrderDto,
  CreateInvoiceItemDto,
  InvoiceItemResponseDto,
  InvoiceResponseDto,
  IssueInvoiceDto,
  ListInvoicesQueryDto,
  TransitionInvoiceDto,
  UpdateInvoiceDto,
  UpdateInvoiceItemDto,
} from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';

@ApiTags(SWAGGER_TAG.Finances)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @RequirePermissions('invoices.read')
  @ApiOperation({
    summary: 'List invoices',
    description: 'Search invoiceNumber; filter status, customer, salesOrder.',
  })
  @ApiPaginatedResponse(InvoiceResponseDto)
  findAll(
    @Query() query: ListInvoicesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<InvoiceResponseDto>> {
    return this.invoicesService.findAll(query, organizationId, user);
  }

  @Post('from-sales-order')
  @RequirePermissions('invoices.write')
  @ApiOperation({
    summary: 'Create a draft invoice from a sales order',
    description:
      'Copies customer, currency and line items. Totals recalculated server-side.',
  })
  @ApiCreatedResponse({ type: InvoiceResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  createFromSalesOrder(
    @Body() dto: CreateInvoiceFromSalesOrderDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.createFromSalesOrder(
      dto,
      organizationId,
      user,
    );
  }

  @Get(':id')
  @RequirePermissions('invoices.read')
  @ApiOperation({ summary: 'Get an invoice with its line items' })
  @ApiOkResponse({ type: InvoiceResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('invoices.write')
  @ApiOperation({
    summary: 'Create a draft invoice',
    description: 'invoiceNumber unique per organization. Optional nested items.',
  })
  @ApiCreatedResponse({ type: InvoiceResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateInvoiceDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('invoices.write')
  @ApiOperation({
    summary: 'Update an invoice',
    description: 'Only while draft.',
  })
  @ApiOkResponse({ type: InvoiceResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('invoices.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete an invoice',
    description: 'Only draft or cancelled.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.invoicesService.remove(id, organizationId, user);
  }

  @Post(':id/issue')
  @RequirePermissions('invoices.issue')
  @ApiOperation({
    summary: 'Issue a draft invoice',
    description:
      'draft → issued. Upserts accounts_receivable (original/balance_due, aging).',
  })
  @ApiOkResponse({ type: InvoiceResponseDto })
  issue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IssueInvoiceDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.issue(id, dto, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('invoices.write')
  @ApiOperation({
    summary: 'Transition invoice status',
    description:
      'Not for draft→issued (use /issue). Cancel writes off open AR when present.',
  })
  @ApiOkResponse({ type: InvoiceResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionInvoiceDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.transition(id, dto, organizationId, user);
  }

  @Get(':id/items')
  @RequirePermissions('invoices.read')
  @ApiOperation({ summary: 'List invoice line items' })
  @ApiOkResponse({ type: [InvoiceItemResponseDto] })
  listItems(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InvoiceItemResponseDto[]> {
    return this.invoicesService.listItems(id, organizationId, user);
  }

  @Post(':id/items')
  @RequirePermissions('invoices.write')
  @ApiOperation({
    summary: 'Add an invoice line item',
    description: 'Only while draft. Recalculates header totals.',
  })
  @ApiCreatedResponse({ type: InvoiceItemResponseDto })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateInvoiceItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InvoiceItemResponseDto> {
    return this.invoicesService.addItem(id, dto, organizationId, user);
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('invoices.write')
  @ApiOperation({
    summary: 'Update an invoice line item',
    description: 'Only while draft.',
  })
  @ApiOkResponse({ type: InvoiceItemResponseDto })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateInvoiceItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InvoiceItemResponseDto> {
    return this.invoicesService.updateItem(
      id,
      itemId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('invoices.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove an invoice line item',
    description: 'Only while draft.',
  })
  @ApiNoContentResponse()
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.invoicesService.removeItem(
      id,
      itemId,
      organizationId,
      user,
    );
  }
}
