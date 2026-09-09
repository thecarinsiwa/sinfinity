import {
  Controller,
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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
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
  ListNotificationsQueryDto,
  NotificationResponseDto,
} from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

class MarkAllReadResponseDto {
  @ApiProperty()
  updated!: number;
}

@ApiTags(SWAGGER_TAG.Collaboration)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  @RequirePermissions('notifications.read')
  @ApiOperation({
    summary: 'List my notifications',
    description:
      'Defaults to unread only (unreadOnly=true). Scoped to current user.',
  })
  @ApiPaginatedResponse(NotificationResponseDto)
  findAll(
    @Query() query: ListNotificationsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<NotificationResponseDto>> {
    return this.notificationsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('notifications.read')
  @ApiOperation({ summary: 'Get a notification' })
  @ApiOkResponse({ type: NotificationResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.findOne(id, organizationId, user);
  }

  @Patch(':id/read')
  @RequirePermissions('notifications.write')
  @ApiOperation({
    summary: 'Mark a notification as read',
  })
  @ApiOkResponse({ type: NotificationResponseDto })
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markRead(id, organizationId, user);
  }

  @Post('read-all')
  @RequirePermissions('notifications.write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all my unread notifications as read',
  })
  @ApiOkResponse({ type: MarkAllReadResponseDto })
  markAllRead(
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ updated: number }> {
    return this.notificationsService.markAllRead(organizationId, user);
  }
}
