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
  ApiNoContentResponse,
  ApiNotFoundResponse,
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
import { CreateDocumentLinkDto } from './dto/create-document-link.dto';
import { DocumentLinkResponseDto } from './dto/document-link-response.dto';
import { ListDocumentLinksQueryDto } from './dto/list-document-links-query.dto';
import { DocumentLinksService } from './document-links.service';

@ApiTags(SWAGGER_TAG.Documents)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('document-links')
export class DocumentLinksController {
  constructor(private readonly documentLinksService: DocumentLinksService) {}

  @Get()
  @RequirePermissions('documents.read')
  @ApiOperation({
    summary: 'List documents linked to an entity',
    description:
      'Requires entityType (allowlisted) and entityId. Returns links with document metadata.',
  })
  @ApiPaginatedResponse(DocumentLinkResponseDto)
  findByEntity(
    @Query() query: ListDocumentLinksQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<DocumentLinkResponseDto>> {
    return this.documentLinksService.findByEntity(
      query,
      organizationId,
      user,
    );
  }

  @Post()
  @RequirePermissions('documents.write')
  @ApiOperation({
    summary: 'Link a document to an entity',
    description:
      'Unique per (documentId, entityType, entityId). entityType and role are allowlisted.',
  })
  @ApiCreatedResponse({ type: DocumentLinkResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateDocumentLinkDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DocumentLinkResponseDto> {
    return this.documentLinksService.create(dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('documents.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlink a document from an entity' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.documentLinksService.remove(id, organizationId, user);
  }
}
