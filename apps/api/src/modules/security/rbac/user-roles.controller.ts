import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import { ListUserRolesQueryDto } from './dto/list-user-roles-query.dto';
import { CreateUserRoleDto, UserRoleResponseDto } from './dto/user-role.dto';
import { UserRolesService } from './user-roles.service';

@ApiTags(SWAGGER_TAG.Securite)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Get()
  @RequirePermissions('roles.read')
  @ApiOperation({ summary: 'List user role assignments' })
  @ApiPaginatedResponse(UserRoleResponseDto)
  findAll(
    @Query() query: ListUserRolesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<UserRoleResponseDto>> {
    return this.userRolesService.findAll(query, organizationId, user);
  }

  @Post()
  @RequirePermissions('roles.write')
  @ApiOperation({
    summary: 'Assign a role to a user',
    description: 'Optional branchId scopes the assignment to a branch.',
  })
  @ApiCreatedResponse({ type: UserRoleResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateUserRoleDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<UserRoleResponseDto> {
    return this.userRolesService.create(dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('roles.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a user role assignment' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.userRolesService.remove(id, organizationId, user);
  }
}
