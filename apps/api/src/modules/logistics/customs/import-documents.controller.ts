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
  CreateImportDocumentDto,
  ImportDocumentResponseDto,
  UpdateImportDocumentDto,
} from './dto/customs.dto';
import { ImportDocumentsService } from './import-documents.service';

@ApiTags(SWAGGER_TAG.Logistique)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('shipments/:shipmentId/import-documents')
export class ImportDocumentsController {
  constructor(
    private readonly importDocumentsService: ImportDocumentsService,
  ) {}

  @Get()
  @RequirePermissions('shipments.read')
  @ApiOperation({
    summary: 'List import documents for a shipment',
    description:
      'BL / AWB / certificate of origin / packing list / invoice links.',
  })
  @ApiOkResponse({ type: [ImportDocumentResponseDto] })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  list(
    @Param('shipmentId', ParseUUIDPipe) shipmentId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ImportDocumentResponseDto[]> {
    return this.importDocumentsService.list(shipmentId, organizationId, user);
  }

  @Post()
  @RequirePermissions('shipments.write')
  @ApiOperation({
    summary: 'Link an import document to a shipment',
    description:
      'docKind: bl|awb|certificate_of_origin|packing_list|invoice. Document same org.',
  })
  @ApiCreatedResponse({ type: ImportDocumentResponseDto })
  create(
    @Param('shipmentId', ParseUUIDPipe) shipmentId: string,
    @Body() dto: CreateImportDocumentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ImportDocumentResponseDto> {
    return this.importDocumentsService.create(
      shipmentId,
      dto,
      organizationId,
      user,
    );
  }

  @Patch(':linkId')
  @RequirePermissions('shipments.write')
  @ApiOperation({ summary: 'Update an import document link' })
  @ApiOkResponse({ type: ImportDocumentResponseDto })
  update(
    @Param('shipmentId', ParseUUIDPipe) shipmentId: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Body() dto: UpdateImportDocumentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ImportDocumentResponseDto> {
    return this.importDocumentsService.update(
      shipmentId,
      linkId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':linkId')
  @RequirePermissions('shipments.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete an import document link' })
  @ApiNoContentResponse()
  remove(
    @Param('shipmentId', ParseUUIDPipe) shipmentId: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.importDocumentsService.remove(
      shipmentId,
      linkId,
      organizationId,
      user,
    );
  }
}
