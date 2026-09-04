import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
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
  ApiResponse,
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
  ConvertNotImplementedDto,
  DecisionCommentsDto,
  QuotationApprovalResponseDto,
} from '../quotation-approvals/dto/quotation-approval.dto';
import {
  QuotationVersionResponseDto,
  QuotationVersionSummaryDto,
  ReviseQuotationDto,
} from '../quotation-versions/dto/quotation-version.dto';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { ListQuotationsQueryDto } from './dto/list-quotations-query.dto';
import {
  CreateQuotationItemDto,
  QuotationItemResponseDto,
  UpdateQuotationItemDto,
} from './dto/quotation-item.dto';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import {
  QuotationTermsResponseDto,
  UpsertQuotationTermsDto,
} from './dto/quotation-terms.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QuotationsService } from './quotations.service';

@ApiTags(SWAGGER_TAG.Devis)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get()
  @RequirePermissions('quotations.read')
  @ApiOperation({
    summary: 'List quotations',
    description: 'Search quoteNumber; filter statusCode, customer, opportunity, owner.',
  })
  @ApiPaginatedResponse(QuotationResponseDto)
  findAll(
    @Query() query: ListQuotationsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<QuotationResponseDto>> {
    return this.quotationsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('quotations.read')
  @ApiOperation({
    summary: 'Get a quotation with items, terms and status',
  })
  @ApiOkResponse({ type: QuotationResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationResponseDto> {
    return this.quotationsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('quotations.write')
  @ApiOperation({
    summary: 'Create a quotation',
    description:
      'Starts in DRAFT. quoteNumber unique per org. Optional nested items/terms; totals computed server-side.',
  })
  @ApiCreatedResponse({ type: QuotationResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateQuotationDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationResponseDto> {
    return this.quotationsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('quotations.write')
  @ApiOperation({
    summary: 'Update a quotation',
    description: 'Only while status is DRAFT.',
  })
  @ApiOkResponse({ type: QuotationResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuotationDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationResponseDto> {
    return this.quotationsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('quotations.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a quotation' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.quotationsService.remove(id, organizationId, user);
  }

  // --- Versions ---

  @Get(':id/versions')
  @RequirePermissions('quotations.read')
  @ApiOperation({
    summary: 'List quotation version history',
    description: 'Summaries without snapshot payload; newest first.',
  })
  @ApiOkResponse({ type: [QuotationVersionSummaryDto] })
  listVersions(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationVersionSummaryDto[]> {
    return this.quotationsService.listVersions(id, organizationId, user);
  }

  @Get(':id/versions/:versionNumber')
  @RequirePermissions('quotations.read')
  @ApiOperation({ summary: 'Get a quotation version snapshot' })
  @ApiOkResponse({ type: QuotationVersionResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationVersionResponseDto> {
    return this.quotationsService.findVersion(
      id,
      versionNumber,
      organizationId,
      user,
    );
  }

  @Post(':id/revise')
  @RequirePermissions('quotations.write')
  @ApiOperation({
    summary: 'Revise a sent or rejected quotation',
    description:
      'Sets status back to DRAFT, increments version and stores a full JSON snapshot.',
  })
  @ApiOkResponse({ type: QuotationResponseDto })
  revise(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviseQuotationDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationResponseDto> {
    return this.quotationsService.revise(id, dto, organizationId, user);
  }

  // --- Approvals & workflow ---

  @Get(':id/approvals')
  @RequirePermissions('quotations.read')
  @ApiOperation({ summary: 'List quotation approval decisions' })
  @ApiOkResponse({ type: [QuotationApprovalResponseDto] })
  listApprovals(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationApprovalResponseDto[]> {
    return this.quotationsService.listApprovals(id, organizationId, user);
  }

  @Post(':id/submit-for-approval')
  @RequirePermissions('quotations.write')
  @ApiOperation({
    summary: 'Submit quotation for internal approval',
    description: 'DRAFT only. Fails if a pending approval already exists.',
  })
  @ApiCreatedResponse({ type: QuotationApprovalResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  submitForApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationApprovalResponseDto> {
    return this.quotationsService.submitForApproval(
      id,
      organizationId,
      user,
    );
  }

  @Post(':id/approve')
  @RequirePermissions('quotations.approve')
  @ApiOperation({ summary: 'Approve the pending quotation approval' })
  @ApiOkResponse({ type: QuotationApprovalResponseDto })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecisionCommentsDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationApprovalResponseDto> {
    return this.quotationsService.approve(id, dto, organizationId, user);
  }

  @Post(':id/reject')
  @RequirePermissions('quotations.approve')
  @ApiOperation({
    summary: 'Reject the pending quotation approval',
    description: 'Internal rejection (not client mark-rejected).',
  })
  @ApiOkResponse({ type: QuotationApprovalResponseDto })
  rejectApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecisionCommentsDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationApprovalResponseDto> {
    return this.quotationsService.rejectApproval(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Post(':id/send')
  @RequirePermissions('quotations.write')
  @ApiOperation({
    summary: 'Send quotation to customer',
    description:
      'DRAFT → SENT. Freezes exchangeRate and sets issueDate (today if omitted). Blocked while approval is pending.',
  })
  @ApiOkResponse({ type: QuotationResponseDto })
  send(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationResponseDto> {
    return this.quotationsService.send(id, organizationId, user);
  }

  @Post(':id/mark-accepted')
  @RequirePermissions('quotations.write')
  @ApiOperation({ summary: 'Mark SENT quotation as ACCEPTED by customer' })
  @ApiOkResponse({ type: QuotationResponseDto })
  markAccepted(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationResponseDto> {
    return this.quotationsService.markAccepted(id, organizationId, user);
  }

  @Post(':id/mark-rejected')
  @RequirePermissions('quotations.write')
  @ApiOperation({ summary: 'Mark SENT quotation as REJECTED by customer' })
  @ApiOkResponse({ type: QuotationResponseDto })
  markRejected(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationResponseDto> {
    return this.quotationsService.markRejected(id, organizationId, user);
  }

  @Post(':id/convert')
  @RequirePermissions('quotations.write')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({
    summary: 'Convert accepted quotation to sales order (stub)',
    description: 'Returns 501 until Phase 8 (sales orders).',
  })
  @ApiResponse({ status: 501, type: ConvertNotImplementedDto })
  convert(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<never> {
    return this.quotationsService.convert(id, organizationId, user);
  }

  // --- Items ---

  @Get(':id/items')
  @RequirePermissions('quotations.read')
  @ApiOperation({ summary: 'List quotation line items' })
  @ApiOkResponse({ type: [QuotationItemResponseDto] })
  listItems(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationItemResponseDto[]> {
    return this.quotationsService.listItems(id, organizationId, user);
  }

  @Post(':id/items')
  @RequirePermissions('quotations.write')
  @ApiOperation({
    summary: 'Add a line item',
    description:
      'DRAFT only. lineTotal / header totals always recalculated server-side.',
  })
  @ApiCreatedResponse({ type: QuotationItemResponseDto })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateQuotationItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationItemResponseDto> {
    return this.quotationsService.addItem(id, dto, organizationId, user);
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('quotations.write')
  @ApiOperation({ summary: 'Update a line item (DRAFT only)' })
  @ApiOkResponse({ type: QuotationItemResponseDto })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateQuotationItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationItemResponseDto> {
    return this.quotationsService.updateItem(
      id,
      itemId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('quotations.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a line item (DRAFT only)' })
  @ApiNoContentResponse()
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.quotationsService.removeItem(
      id,
      itemId,
      organizationId,
      user,
    );
  }

  // --- Terms (1:1) ---

  @Get(':id/terms')
  @RequirePermissions('quotations.read')
  @ApiOperation({ summary: 'Get quotation commercial terms' })
  @ApiOkResponse({ type: QuotationTermsResponseDto })
  getTerms(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationTermsResponseDto | null> {
    return this.quotationsService.getTerms(id, organizationId, user);
  }

  @Put(':id/terms')
  @RequirePermissions('quotations.write')
  @ApiOperation({
    summary: 'Upsert quotation commercial terms',
    description: 'One terms row per quotation. DRAFT only.',
  })
  @ApiOkResponse({ type: QuotationTermsResponseDto })
  upsertTerms(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertQuotationTermsDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<QuotationTermsResponseDto> {
    return this.quotationsService.upsertTerms(id, dto, organizationId, user);
  }
}
