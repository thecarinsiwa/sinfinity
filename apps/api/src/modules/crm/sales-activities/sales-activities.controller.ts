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
import { CreateSalesActivityDto } from './dto/create-sales-activity.dto';
import { ListSalesActivitiesQueryDto } from './dto/list-sales-activities-query.dto';
import { SalesActivityResponseDto } from './dto/sales-activity-response.dto';
import { UpdateSalesActivityDto } from './dto/update-sales-activity.dto';
import { SalesActivitiesService } from './sales-activities.service';

@ApiTags(SWAGGER_TAG.Crm)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales-activities')
export class SalesActivitiesController {
  constructor(
    private readonly salesActivitiesService: SalesActivitiesService,
  ) {}

  @Get()
  @RequirePermissions('activities.read')
  @ApiOperation({
    summary: 'List sales activities',
    description:
      'Filter by related entity, activity type, user, scheduledAt range.',
  })
  @ApiPaginatedResponse(SalesActivityResponseDto)
  findAll(
    @Query() query: ListSalesActivitiesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<SalesActivityResponseDto>> {
    return this.salesActivitiesService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('activities.read')
  @ApiOperation({ summary: 'Get a sales activity by id' })
  @ApiOkResponse({ type: SalesActivityResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesActivityResponseDto> {
    return this.salesActivitiesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('activities.write')
  @ApiOperation({
    summary: 'Create a sales activity',
    description:
      'relatedType allowlist: lead|customer|opportunity. userId defaults to current user.',
  })
  @ApiCreatedResponse({ type: SalesActivityResponseDto })
  create(
    @Body() dto: CreateSalesActivityDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesActivityResponseDto> {
    return this.salesActivitiesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('activities.write')
  @ApiOperation({ summary: 'Update a sales activity' })
  @ApiOkResponse({ type: SalesActivityResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSalesActivityDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesActivityResponseDto> {
    return this.salesActivitiesService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('activities.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a sales activity' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.salesActivitiesService.remove(id, organizationId, user);
  }
}
