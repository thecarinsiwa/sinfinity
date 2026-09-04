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
import { CreateLeadSourceDto } from './dto/create-lead-source.dto';
import { LeadSourceResponseDto } from './dto/lead-source-response.dto';
import { ListLeadSourcesQueryDto } from './dto/list-lead-sources-query.dto';
import { UpdateLeadSourceDto } from './dto/update-lead-source.dto';
import { LeadSourcesService } from './lead-sources.service';

@ApiTags(SWAGGER_TAG.Crm)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('lead-sources')
export class LeadSourcesController {
  constructor(private readonly leadSourcesService: LeadSourcesService) {}

  @Get()
  @RequirePermissions('leads.read')
  @ApiOperation({ summary: 'List lead sources' })
  @ApiPaginatedResponse(LeadSourceResponseDto)
  findAll(
    @Query() query: ListLeadSourcesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<LeadSourceResponseDto>> {
    return this.leadSourcesService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('leads.read')
  @ApiOperation({ summary: 'Get a lead source by id' })
  @ApiOkResponse({ type: LeadSourceResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LeadSourceResponseDto> {
    return this.leadSourcesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('leads.write')
  @ApiOperation({ summary: 'Create a lead source' })
  @ApiCreatedResponse({ type: LeadSourceResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateLeadSourceDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LeadSourceResponseDto> {
    return this.leadSourcesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('leads.write')
  @ApiOperation({ summary: 'Update a lead source' })
  @ApiOkResponse({ type: LeadSourceResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadSourceDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LeadSourceResponseDto> {
    return this.leadSourcesService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('leads.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a lead source' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.leadSourcesService.remove(id, organizationId, user);
  }
}
