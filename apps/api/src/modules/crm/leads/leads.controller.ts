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
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import {
  ConvertLeadResponseDto,
  LeadResponseDto,
} from './dto/lead-response.dto';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@ApiTags(SWAGGER_TAG.Crm)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @RequirePermissions('leads.read')
  @ApiOperation({
    summary: 'List leads',
    description: 'Search company/contact/email; filter status, source, owner.',
  })
  @ApiPaginatedResponse(LeadResponseDto)
  findAll(
    @Query() query: ListLeadsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<LeadResponseDto>> {
    return this.leadsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('leads.read')
  @ApiOperation({ summary: 'Get a lead by id' })
  @ApiOkResponse({ type: LeadResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LeadResponseDto> {
    return this.leadsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('leads.write')
  @ApiOperation({ summary: 'Create a lead' })
  @ApiCreatedResponse({ type: LeadResponseDto })
  create(
    @Body() dto: CreateLeadDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LeadResponseDto> {
    return this.leadsService.create(dto, organizationId, user);
  }

  @Post(':id/convert')
  @RequirePermissions('leads.convert')
  @ApiOperation({
    summary: 'Convert a lead into a customer',
    description:
      'Allowed when status is new, contacted or qualified. Links convertedCustomerId / convertedFromLeadId.',
  })
  @ApiOkResponse({ type: ConvertLeadResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  convert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertLeadDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ConvertLeadResponseDto> {
    return this.leadsService.convert(id, dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('leads.write')
  @ApiOperation({
    summary: 'Update a lead',
    description:
      'Status workflow: new → contacted → qualified → lost. Use convert for converted.',
  })
  @ApiOkResponse({ type: LeadResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LeadResponseDto> {
    return this.leadsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('leads.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a lead' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.leadsService.remove(id, organizationId, user);
  }
}
