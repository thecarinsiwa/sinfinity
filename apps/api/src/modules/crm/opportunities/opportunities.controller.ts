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
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import {
  ListOpportunitiesQueryDto,
  RecalculateAmountQueryDto,
} from './dto/list-opportunities-query.dto';
import {
  CreateOpportunityItemDto,
  OpportunityItemResponseDto,
  UpdateOpportunityItemDto,
} from './dto/opportunity-item.dto';
import { OpportunityResponseDto } from './dto/opportunity-response.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunitiesService } from './opportunities.service';

@ApiTags(SWAGGER_TAG.Crm)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  @RequirePermissions('opportunities.read')
  @ApiOperation({
    summary: 'List opportunities',
    description: 'Search name; filter stage, customer, lead, owner.',
  })
  @ApiPaginatedResponse(OpportunityResponseDto)
  findAll(
    @Query() query: ListOpportunitiesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<OpportunityResponseDto>> {
    return this.opportunitiesService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('opportunities.read')
  @ApiOperation({ summary: 'Get an opportunity with its line items' })
  @ApiOkResponse({ type: OpportunityResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('opportunities.write')
  @ApiOperation({
    summary: 'Create an opportunity',
    description:
      'customerId required. Optional nested items; amount auto-summed when omitted.',
  })
  @ApiCreatedResponse({ type: OpportunityResponseDto })
  create(
    @Body() dto: CreateOpportunityDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('opportunities.write')
  @ApiOperation({ summary: 'Update an opportunity' })
  @ApiOkResponse({ type: OpportunityResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOpportunityDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<OpportunityResponseDto> {
    return this.opportunitiesService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('opportunities.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an opportunity' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.opportunitiesService.remove(id, organizationId, user);
  }

  @Get(':id/items')
  @RequirePermissions('opportunities.read')
  @ApiOperation({ summary: 'List opportunity line items' })
  @ApiOkResponse({ type: [OpportunityItemResponseDto] })
  listItems(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<OpportunityItemResponseDto[]> {
    return this.opportunitiesService.listItems(id, organizationId, user);
  }

  @Post(':id/items')
  @RequirePermissions('opportunities.write')
  @ApiOperation({
    summary: 'Add a line item',
    description:
      'Pass recalculateAmount=true to set opportunity.amount = Σ line_total.',
  })
  @ApiCreatedResponse({ type: OpportunityItemResponseDto })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateOpportunityItemDto,
    @Query() query: RecalculateAmountQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<OpportunityItemResponseDto> {
    return this.opportunitiesService.addItem(
      id,
      dto,
      query.recalculateAmount === true,
      organizationId,
      user,
    );
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('opportunities.write')
  @ApiOperation({ summary: 'Update a line item' })
  @ApiOkResponse({ type: OpportunityItemResponseDto })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateOpportunityItemDto,
    @Query() query: RecalculateAmountQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<OpportunityItemResponseDto> {
    return this.opportunitiesService.updateItem(
      id,
      itemId,
      dto,
      query.recalculateAmount === true,
      organizationId,
      user,
    );
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('opportunities.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a line item' })
  @ApiNoContentResponse()
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Query() query: RecalculateAmountQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.opportunitiesService.removeItem(
      id,
      itemId,
      query.recalculateAmount === true,
      organizationId,
      user,
    );
  }
}
