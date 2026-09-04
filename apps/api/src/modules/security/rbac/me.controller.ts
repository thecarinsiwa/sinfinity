import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ErrorResponseDto,
  JwtAuthGuard,
  type AuthUser,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { PermissionsLoader } from '../../auth/permissions.loader';

export class MePermissionsResponseDto {
  @ApiProperty({ type: [String], example: ['users.read', 'roles.write'] })
  permissions!: string[];
}

@ApiTags('Sécurité')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly permissionsLoader: PermissionsLoader) {}

  @Get('permissions')
  @ApiOperation({
    summary: 'List permission codes for the current user',
  })
  @ApiOkResponse({ type: MePermissionsResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  async permissions(
    @CurrentUser() user: AuthUser,
  ): Promise<MePermissionsResponseDto> {
    const permissions =
      user.permissions ?? (await this.permissionsLoader.loadForUser(user.id));
    return { permissions };
  }
}
