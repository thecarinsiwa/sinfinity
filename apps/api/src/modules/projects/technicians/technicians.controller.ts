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
import {
  CreateTechnicianDto,
  ListTechniciansQueryDto,
  TechnicianResponseDto,
  UpdateTechnicianDto,
} from './dto/technician.dto';
import { TechniciansService } from './technicians.service';

@ApiTags(SWAGGER_TAG.Projets)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('technicians')
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  @Get()
  @RequirePermissions('projects.read')
  @ApiOperation({
    summary: 'List technicians',
    description:
      'Search name/email/phone; filter isActive. Soft-deleted excluded.',
  })
  @ApiPaginatedResponse(TechnicianResponseDto)
  findAll(
    @Query() query: ListTechniciansQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<TechnicianResponseDto>> {
    return this.techniciansService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'Get a technician by id' })
  @ApiOkResponse({ type: TechnicianResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<TechnicianResponseDto> {
    return this.techniciansService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('projects.write')
  @ApiOperation({
    summary: 'Create a technician',
    description: 'skills stored as JSON string array; optional linked userId.',
  })
  @ApiCreatedResponse({ type: TechnicianResponseDto })
  create(
    @Body() dto: CreateTechnicianDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<TechnicianResponseDto> {
    return this.techniciansService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('projects.write')
  @ApiOperation({ summary: 'Update a technician' })
  @ApiOkResponse({ type: TechnicianResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTechnicianDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<TechnicianResponseDto> {
    return this.techniciansService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('projects.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a technician' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.techniciansService.remove(id, organizationId, user);
  }
}
