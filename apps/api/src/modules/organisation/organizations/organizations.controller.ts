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
  ApiForbiddenResponse,
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
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { ListOrganizationsQueryDto } from './dto/list-organizations-query.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('Organisation')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @RequirePermissions('organizations.read')
  @ApiOperation({
    summary: 'List organizations',
    description:
      'Super-admins see all tenants. Other users only see their organization.',
  })
  @ApiPaginatedResponse(OrganizationResponseDto)
  findAll(
    @Query() query: ListOrganizationsQueryDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<OrganizationResponseDto>> {
    return this.organizationsService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions('organizations.read')
  @ApiOperation({ summary: 'Get an organization by id' })
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.findOne(id, user);
  }

  @Post()
  @RequirePermissions('organizations.write')
  @ApiOperation({
    summary: 'Create an organization',
    description:
      'Super-admin only. First tenant bootstrap is expected via SQL seed.',
  })
  @ApiCreatedResponse({ type: OrganizationResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('organizations.write')
  @ApiOperation({ summary: 'Update an organization' })
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('organizations.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an organization' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.organizationsService.remove(id, user);
  }
}
