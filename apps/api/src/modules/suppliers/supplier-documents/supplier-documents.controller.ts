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
  CurrentUser,
  ErrorResponseDto,
  JwtAuthGuard,
  OrganizationId,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import {
  CreateSupplierDocumentDto,
  SupplierDocumentResponseDto,
  UpdateSupplierDocumentDto,
} from './dto/supplier-document.dto';
import { SupplierDocumentsService } from './supplier-documents.service';

@ApiTags(SWAGGER_TAG.Fournisseurs)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('suppliers/:supplierId/documents')
export class SupplierDocumentsController {
  constructor(
    private readonly supplierDocumentsService: SupplierDocumentsService,
  ) {}

  @Get()
  @RequirePermissions('suppliers.read')
  @ApiOperation({
    summary: 'List supplier documents',
    description:
      'Dedicated supplier_documents links (complementary to polymorphic document_links).',
  })
  @ApiOkResponse({ type: [SupplierDocumentResponseDto] })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  list(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierDocumentResponseDto[]> {
    return this.supplierDocumentsService.list(
      supplierId,
      organizationId,
      user,
    );
  }

  @Post()
  @RequirePermissions('suppliers.write')
  @ApiOperation({
    summary: 'Link a document to a supplier',
    description: 'Document must exist, same org, and not be soft-deleted.',
  })
  @ApiCreatedResponse({ type: SupplierDocumentResponseDto })
  create(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
    @Body() dto: CreateSupplierDocumentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierDocumentResponseDto> {
    return this.supplierDocumentsService.create(
      supplierId,
      dto,
      organizationId,
      user,
    );
  }

  @Patch(':documentLinkId')
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Update a supplier document link' })
  @ApiOkResponse({ type: SupplierDocumentResponseDto })
  update(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
    @Param('documentLinkId', ParseUUIDPipe) documentLinkId: string,
    @Body() dto: UpdateSupplierDocumentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierDocumentResponseDto> {
    return this.supplierDocumentsService.update(
      supplierId,
      documentLinkId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':documentLinkId')
  @RequirePermissions('suppliers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a supplier document link' })
  @ApiNoContentResponse()
  remove(
    @Param('supplierId', ParseUUIDPipe) supplierId: string,
    @Param('documentLinkId', ParseUUIDPipe) documentLinkId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.supplierDocumentsService.remove(
      supplierId,
      documentLinkId,
      organizationId,
      user,
    );
  }
}
