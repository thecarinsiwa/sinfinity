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
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { DocumentTypeResponseDto } from './dto/document-type-response.dto';
import { ListDocumentTypesQueryDto } from './dto/list-document-types-query.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';
import { DocumentTypesService } from './document-types.service';

@ApiTags(SWAGGER_TAG.Documents)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('document-types')
export class DocumentTypesController {
  constructor(private readonly documentTypesService: DocumentTypesService) {}

  @Get()
  @RequirePermissions('documents.read')
  @ApiOperation({
    summary: 'List document types',
    description: 'Includes system types and organization types by default.',
  })
  @ApiPaginatedResponse(DocumentTypeResponseDto)
  findAll(
    @Query() query: ListDocumentTypesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<DocumentTypeResponseDto>> {
    return this.documentTypesService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'Get a document type by id' })
  @ApiOkResponse({ type: DocumentTypeResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DocumentTypeResponseDto> {
    return this.documentTypesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('documents.write')
  @ApiOperation({ summary: 'Create an organization document type' })
  @ApiCreatedResponse({ type: DocumentTypeResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateDocumentTypeDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DocumentTypeResponseDto> {
    return this.documentTypesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('documents.write')
  @ApiOperation({
    summary: 'Update a document type',
    description: 'System types: super-admin only.',
  })
  @ApiOkResponse({ type: DocumentTypeResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentTypeDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DocumentTypeResponseDto> {
    return this.documentTypesService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('documents.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an organization document type' })
  @ApiNoContentResponse()
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.documentTypesService.remove(id, organizationId, user);
  }
}
