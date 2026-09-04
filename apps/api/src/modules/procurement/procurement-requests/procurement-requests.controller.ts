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
import { CreateProcurementRequestDto } from './dto/create-procurement-request.dto';
import { ListProcurementRequestsQueryDto } from './dto/list-procurement-requests-query.dto';
import {
  CreateProcurementRequestItemDto,
  ProcurementRequestItemResponseDto,
  UpdateProcurementRequestItemDto,
} from './dto/procurement-request-item.dto';
import { ProcurementRequestResponseDto } from './dto/procurement-request-response.dto';
import { TransitionProcurementRequestDto } from './dto/transition-procurement-request.dto';
import { UpdateProcurementRequestDto } from './dto/update-procurement-request.dto';
import { ProcurementRequestsService } from './procurement-requests.service';

@ApiTags(SWAGGER_TAG.Sourcing)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('procurement-requests')
export class ProcurementRequestsController {
  constructor(
    private readonly procurementRequestsService: ProcurementRequestsService,
  ) {}

  @Get()
  @RequirePermissions('procurement.read')
  @ApiOperation({
    summary: 'List procurement requests',
    description:
      'Search requestNumber/title; filter status, priority, opportunity, sales order, requester.',
  })
  @ApiPaginatedResponse(ProcurementRequestResponseDto)
  findAll(
    @Query() query: ListProcurementRequestsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<ProcurementRequestResponseDto>> {
    return this.procurementRequestsService.findAll(
      query,
      organizationId,
      user,
    );
  }

  @Get(':id')
  @RequirePermissions('procurement.read')
  @ApiOperation({ summary: 'Get a procurement request with its line items' })
  @ApiOkResponse({ type: ProcurementRequestResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementRequestResponseDto> {
    return this.procurementRequestsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('procurement.write')
  @ApiOperation({
    summary: 'Create a procurement request',
    description:
      'Starts in draft. requestNumber unique per org. Optional nested items; productId nullable if description is set.',
  })
  @ApiCreatedResponse({ type: ProcurementRequestResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateProcurementRequestDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementRequestResponseDto> {
    return this.procurementRequestsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('procurement.write')
  @ApiOperation({
    summary: 'Update a procurement request header',
    description: 'Not allowed while closed or cancelled.',
  })
  @ApiOkResponse({ type: ProcurementRequestResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProcurementRequestDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementRequestResponseDto> {
    return this.procurementRequestsService.update(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id')
  @RequirePermissions('procurement.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a procurement request' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.procurementRequestsService.remove(id, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('procurement.write')
  @ApiOperation({
    summary: 'Transition procurement request status',
    description:
      'Forward-only: draft → open → quoted → compared → approved → closed (+ cancelled except from approved/closed).',
  })
  @ApiOkResponse({ type: ProcurementRequestResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionProcurementRequestDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementRequestResponseDto> {
    return this.procurementRequestsService.transition(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Get(':id/items')
  @RequirePermissions('procurement.read')
  @ApiOperation({ summary: 'List procurement request line items' })
  @ApiOkResponse({ type: [ProcurementRequestItemResponseDto] })
  listItems(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementRequestItemResponseDto[]> {
    return this.procurementRequestsService.listItems(
      id,
      organizationId,
      user,
    );
  }

  @Post(':id/items')
  @RequirePermissions('procurement.write')
  @ApiOperation({
    summary: 'Add a line item',
    description:
      'Draft or open only. Requires productId and/or free-text description.',
  })
  @ApiCreatedResponse({ type: ProcurementRequestItemResponseDto })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProcurementRequestItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementRequestItemResponseDto> {
    return this.procurementRequestsService.addItem(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('procurement.write')
  @ApiOperation({ summary: 'Update a line item (draft or open only)' })
  @ApiOkResponse({ type: ProcurementRequestItemResponseDto })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateProcurementRequestItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementRequestItemResponseDto> {
    return this.procurementRequestsService.updateItem(
      id,
      itemId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('procurement.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a line item (draft or open only)' })
  @ApiNoContentResponse()
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.procurementRequestsService.removeItem(
      id,
      itemId,
      organizationId,
      user,
    );
  }
}
