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
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import {
  DocumentResponseDto,
  DocumentVersionResponseDto,
} from './dto/document-response.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UploadDocumentVersionDto } from './dto/upload-document-version.dto';
import { DocumentsService } from './documents.service';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

@ApiTags(SWAGGER_TAG.Documents)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'List documents' })
  @ApiPaginatedResponse(DocumentResponseDto)
  findAll(
    @Query() query: ListDocumentsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<DocumentResponseDto>> {
    return this.documentsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'Get document metadata' })
  @ApiOkResponse({ type: DocumentResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.findOne(id, organizationId, user);
  }

  @Get(':id/versions')
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'List document versions' })
  @ApiOkResponse({ type: [DocumentVersionResponseDto] })
  listVersions(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DocumentVersionResponseDto[]> {
    return this.documentsService.listVersions(id, organizationId, user);
  }

  @Get(':id/download')
  @RequirePermissions('documents.read')
  @ApiOperation({ summary: 'Download the current document file' })
  @ApiOkResponse({
    description: 'Binary file stream',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<StreamableFile> {
    const file = await this.documentsService.openDownload(
      id,
      organizationId,
      user,
    );
    return new StreamableFile(file.stream as never, {
      type: file.mimeType,
      disposition: `attachment; filename="${file.fileName.replace(/"/g, '')}"`,
      length: file.fileSize ?? undefined,
    });
  }

  @Post()
  @RequirePermissions('documents.write')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDocumentDto })
  @ApiOperation({ summary: 'Upload a document (version 1)' })
  @ApiCreatedResponse({ type: DocumentResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadDocumentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.upload(
      file,
      dto.title,
      dto.documentTypeId,
      organizationId,
      user,
    );
  }

  @Post(':id/versions')
  @RequirePermissions('documents.write')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDocumentVersionDto })
  @ApiOperation({ summary: 'Upload a new document version' })
  @ApiOkResponse({ type: DocumentResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  uploadVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadDocumentVersionDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.uploadVersion(
      id,
      file,
      dto.changeNotes,
      organizationId,
      user,
    );
  }

  @Patch(':id')
  @RequirePermissions('documents.write')
  @ApiOperation({ summary: 'Update document title or status' })
  @ApiOkResponse({ type: DocumentResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('documents.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a document (status=deleted)' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.documentsService.softDelete(id, organizationId, user);
  }
}
