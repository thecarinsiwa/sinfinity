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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
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
  OrganizationId,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { CreateRoleDto } from './dto/create-role.dto';
import { ListRolesQueryDto } from './dto/list-roles-query.dto';
import {
  PermissionResponseDto,
  RoleResponseDto,
} from './dto/role-response.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('Sécurité')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions')
  @RequirePermissions('roles.read')
  @ApiOperation({ summary: 'List all permission codes' })
  @ApiOkResponse({ type: [PermissionResponseDto] })
  listPermissions(): Promise<PermissionResponseDto[]> {
    return this.rolesService.listPermissions();
  }

  @Get('roles')
  @RequirePermissions('roles.read')
  @ApiOperation({
    summary: 'List roles',
    description: 'Includes system roles and organization roles by default.',
  })
  @ApiPaginatedResponse(RoleResponseDto)
  findAll(
    @Query() query: ListRolesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<RoleResponseDto>> {
    return this.rolesService.findAll(query, organizationId, user);
  }

  @Get('roles/:id')
  @RequirePermissions('roles.read')
  @ApiOperation({ summary: 'Get a role by id' })
  @ApiOkResponse({ type: RoleResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<RoleResponseDto> {
    return this.rolesService.findOne(id, organizationId, user);
  }

  @Post('roles')
  @RequirePermissions('roles.write')
  @ApiOperation({ summary: 'Create an organization role' })
  @ApiCreatedResponse({ type: RoleResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateRoleDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<RoleResponseDto> {
    return this.rolesService.create(dto, organizationId, user);
  }

  @Patch('roles/:id')
  @RequirePermissions('roles.write')
  @ApiOperation({ summary: 'Update a role (system roles: super-admin only)' })
  @ApiOkResponse({ type: RoleResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<RoleResponseDto> {
    return this.rolesService.update(id, dto, organizationId, user);
  }

  @Delete('roles/:id')
  @RequirePermissions('roles.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an organization role' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.rolesService.remove(id, organizationId, user);
  }

  @Put('roles/:id/permissions')
  @RequirePermissions('roles.write')
  @ApiOperation({
    summary: 'Replace role permissions',
    description: 'Provide permissionIds or permissionCodes (exact set).',
  })
  @ApiOkResponse({ type: RoleResponseDto })
  setPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetRolePermissionsDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<RoleResponseDto> {
    return this.rolesService.setPermissions(id, dto, organizationId, user);
  }

  @Post('roles/:id/permissions/:permissionId')
  @RequirePermissions('roles.write')
  @ApiOperation({ summary: 'Add one permission to a role' })
  @ApiOkResponse({ type: RoleResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  addPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<RoleResponseDto> {
    return this.rolesService.addPermission(
      id,
      permissionId,
      organizationId,
      user,
    );
  }

  @Delete('roles/:id/permissions/:permissionId')
  @RequirePermissions('roles.write')
  @ApiOperation({ summary: 'Remove one permission from a role' })
  @ApiOkResponse({ type: RoleResponseDto })
  removePermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<RoleResponseDto> {
    return this.rolesService.removePermission(
      id,
      permissionId,
      organizationId,
      user,
    );
  }
}
