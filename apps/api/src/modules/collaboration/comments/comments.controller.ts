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
  CommentResponseDto,
  CommentThreadNodeDto,
  CreateCommentDto,
  ListCommentsQueryDto,
  ThreadCommentsQueryDto,
  UpdateCommentDto,
} from './dto/comment.dto';
import { CommentsService } from './comments.service';

@ApiTags(SWAGGER_TAG.Collaboration)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @RequirePermissions('comments.read')
  @ApiOperation({
    summary: 'List comments',
    description: 'Filter entityType/entityId, author, rootsOnly.',
  })
  @ApiPaginatedResponse(CommentResponseDto)
  findAll(
    @Query() query: ListCommentsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<CommentResponseDto>> {
    return this.commentsService.findAll(query, organizationId, user);
  }

  @Get('thread')
  @RequirePermissions('comments.read')
  @ApiOperation({
    summary: 'Comment thread for an entity',
    description:
      'Nested tree by parentCommentId for the given entityType + entityId.',
  })
  @ApiOkResponse({ type: [CommentThreadNodeDto] })
  findThread(
    @Query() query: ThreadCommentsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CommentThreadNodeDto[]> {
    return this.commentsService.findThread(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('comments.read')
  @ApiOperation({ summary: 'Get a comment' })
  @ApiOkResponse({ type: CommentResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CommentResponseDto> {
    return this.commentsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('comments.write')
  @ApiOperation({
    summary: 'Create a comment',
    description:
      'Polymorphic entityType/entityId. Optional parentCommentId for replies.',
  })
  @ApiCreatedResponse({ type: CommentResponseDto })
  create(
    @Body() dto: CreateCommentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CommentResponseDto> {
    return this.commentsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('comments.write')
  @ApiOperation({ summary: 'Update comment body' })
  @ApiOkResponse({ type: CommentResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CommentResponseDto> {
    return this.commentsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('comments.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a comment' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.commentsService.remove(id, organizationId, user);
  }
}
