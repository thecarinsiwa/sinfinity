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
import { CreateProcurementQuoteDto } from './dto/create-procurement-quote.dto';
import {
  CreateProcurementQuoteItemDto,
  ProcurementQuoteItemResponseDto,
  UpdateProcurementQuoteItemDto,
} from './dto/procurement-quote-item.dto';
import { ProcurementQuoteResponseDto } from './dto/procurement-quote-response.dto';
import { TransitionProcurementQuoteDto } from './dto/transition-procurement-quote.dto';
import { UpdateProcurementQuoteDto } from './dto/update-procurement-quote.dto';
import { ProcurementQuotesService } from './procurement-quotes.service';

@ApiTags(SWAGGER_TAG.Sourcing)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('procurement-requests/:requestId/quotes')
export class ProcurementQuotesController {
  constructor(
    private readonly procurementQuotesService: ProcurementQuotesService,
  ) {}

  @Get()
  @RequirePermissions('procurement.read')
  @ApiOperation({ summary: 'List quotes for a procurement request' })
  @ApiOkResponse({ type: [ProcurementQuoteResponseDto] })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  list(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementQuoteResponseDto[]> {
    return this.procurementQuotesService.list(
      requestId,
      organizationId,
      user,
    );
  }

  @Post()
  @RequirePermissions('procurement.write')
  @ApiOperation({
    summary: 'Create a supplier quote on a request',
    description:
      'Allowed while request is open/quoted/compared. First quote bumps open → quoted. totalAmount computed from items.',
  })
  @ApiCreatedResponse({ type: ProcurementQuoteResponseDto })
  create(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: CreateProcurementQuoteDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementQuoteResponseDto> {
    return this.procurementQuotesService.create(
      requestId,
      dto,
      organizationId,
      user,
    );
  }

  @Get(':quoteId')
  @RequirePermissions('procurement.read')
  @ApiOperation({ summary: 'Get a quote with its line items' })
  @ApiOkResponse({ type: ProcurementQuoteResponseDto })
  findOne(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementQuoteResponseDto> {
    return this.procurementQuotesService.findOne(
      requestId,
      quoteId,
      organizationId,
      user,
    );
  }

  @Patch(':quoteId')
  @RequirePermissions('procurement.write')
  @ApiOperation({ summary: 'Update quote header (incoterm, lead time, dates)' })
  @ApiOkResponse({ type: ProcurementQuoteResponseDto })
  update(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @Body() dto: UpdateProcurementQuoteDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementQuoteResponseDto> {
    return this.procurementQuotesService.update(
      requestId,
      quoteId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':quoteId')
  @RequirePermissions('procurement.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a quote' })
  @ApiNoContentResponse()
  remove(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.procurementQuotesService.remove(
      requestId,
      quoteId,
      organizationId,
      user,
    );
  }

  @Post(':quoteId/transition')
  @RequirePermissions('procurement.write')
  @ApiOperation({
    summary: 'Transition quote status',
    description:
      'received → shortlisted → selected (+ rejected). Selecting demotes other selected quotes on the same request to shortlisted.',
  })
  @ApiOkResponse({ type: ProcurementQuoteResponseDto })
  transition(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @Body() dto: TransitionProcurementQuoteDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementQuoteResponseDto> {
    return this.procurementQuotesService.transition(
      requestId,
      quoteId,
      dto,
      organizationId,
      user,
    );
  }

  @Get(':quoteId/items')
  @RequirePermissions('procurement.read')
  @ApiOperation({ summary: 'List quote line items' })
  @ApiOkResponse({ type: [ProcurementQuoteItemResponseDto] })
  listItems(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementQuoteItemResponseDto[]> {
    return this.procurementQuotesService.listItems(
      requestId,
      quoteId,
      organizationId,
      user,
    );
  }

  @Post(':quoteId/items')
  @RequirePermissions('procurement.write')
  @ApiOperation({
    summary: 'Add a quote line item',
    description:
      'lineTotal = qty × unitPrice; header totalAmount recalculated. procurementRequestItemId must belong to the parent request.',
  })
  @ApiCreatedResponse({ type: ProcurementQuoteItemResponseDto })
  addItem(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @Body() dto: CreateProcurementQuoteItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementQuoteItemResponseDto> {
    return this.procurementQuotesService.addItem(
      requestId,
      quoteId,
      dto,
      organizationId,
      user,
    );
  }

  @Patch(':quoteId/items/:itemId')
  @RequirePermissions('procurement.write')
  @ApiOperation({ summary: 'Update a quote line item' })
  @ApiOkResponse({ type: ProcurementQuoteItemResponseDto })
  updateItem(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateProcurementQuoteItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementQuoteItemResponseDto> {
    return this.procurementQuotesService.updateItem(
      requestId,
      quoteId,
      itemId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':quoteId/items/:itemId')
  @RequirePermissions('procurement.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a quote line item' })
  @ApiNoContentResponse()
  removeItem(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.procurementQuotesService.removeItem(
      requestId,
      quoteId,
      itemId,
      organizationId,
      user,
    );
  }
}
