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
import { CreateSupplierQuoteDto } from './dto/create-supplier-quote.dto';
import { ListSupplierQuotesQueryDto } from './dto/list-supplier-quotes-query.dto';
import {
  CreateSupplierQuoteItemDto,
  SupplierQuoteItemResponseDto,
  UpdateSupplierQuoteItemDto,
} from './dto/supplier-quote-item.dto';
import { SupplierQuoteResponseDto } from './dto/supplier-quote-response.dto';
import { TransitionSupplierQuoteDto } from './dto/transition-supplier-quote.dto';
import { UpdateSupplierQuoteDto } from './dto/update-supplier-quote.dto';
import { SupplierQuotesService } from './supplier-quotes.service';

@ApiTags(SWAGGER_TAG.Fournisseurs)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('supplier-quotes')
export class SupplierQuotesController {
  constructor(
    private readonly supplierQuotesService: SupplierQuotesService,
  ) {}

  @Get()
  @RequirePermissions('suppliers.read')
  @ApiOperation({
    summary: 'List free-form supplier quotes',
    description:
      'Distinct from procurement_quotes. Filter by supplierId, status, quote_number search.',
  })
  @ApiPaginatedResponse(SupplierQuoteResponseDto)
  findAll(
    @Query() query: ListSupplierQuotesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<SupplierQuoteResponseDto>> {
    return this.supplierQuotesService.findAll(query, organizationId, user);
  }

  @Post()
  @RequirePermissions('suppliers.write')
  @ApiOperation({
    summary: 'Create a supplier quote',
    description:
      'Starts in draft. Optional nested items; lineTotal = qty × unitPrice.',
  })
  @ApiCreatedResponse({ type: SupplierQuoteResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateSupplierQuoteDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierQuoteResponseDto> {
    return this.supplierQuotesService.create(dto, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'Get a supplier quote with line items' })
  @ApiOkResponse({ type: SupplierQuoteResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierQuoteResponseDto> {
    return this.supplierQuotesService.findOne(id, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('suppliers.write')
  @ApiOperation({
    summary: 'Update quote header',
    description: 'Only while draft or received.',
  })
  @ApiOkResponse({ type: SupplierQuoteResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierQuoteDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierQuoteResponseDto> {
    return this.supplierQuotesService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('suppliers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a supplier quote' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.supplierQuotesService.remove(id, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('suppliers.write')
  @ApiOperation({
    summary: 'Transition quote status',
    description:
      'draft → received|rejected|expired ; received → selected|rejected|expired.',
  })
  @ApiOkResponse({ type: SupplierQuoteResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionSupplierQuoteDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierQuoteResponseDto> {
    return this.supplierQuotesService.transition(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Get(':id/items')
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'List quote line items' })
  @ApiOkResponse({ type: [SupplierQuoteItemResponseDto] })
  listItems(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierQuoteItemResponseDto[]> {
    return this.supplierQuotesService.listItems(id, organizationId, user);
  }

  @Post(':id/items')
  @RequirePermissions('suppliers.write')
  @ApiOperation({
    summary: 'Add a quote line item',
    description: 'lineTotal = quantity × unitPrice (server-computed).',
  })
  @ApiCreatedResponse({ type: SupplierQuoteItemResponseDto })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSupplierQuoteItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierQuoteItemResponseDto> {
    return this.supplierQuotesService.addItem(id, dto, organizationId, user);
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Update a quote line item' })
  @ApiOkResponse({ type: SupplierQuoteItemResponseDto })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateSupplierQuoteItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierQuoteItemResponseDto> {
    return this.supplierQuotesService.updateItem(
      id,
      itemId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('suppliers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a quote line item' })
  @ApiNoContentResponse()
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.supplierQuotesService.removeItem(
      id,
      itemId,
      organizationId,
      user,
    );
  }
}
