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
import { CustomsDeclarationsService } from './customs-declarations.service';
import {
  CreateCustomsDeclarationDto,
  CreateCustomsDocumentDto,
  CustomsDeclarationResponseDto,
  CustomsDocumentResponseDto,
  ListCustomsDeclarationsQueryDto,
  UpdateCustomsDeclarationDto,
  UpdateCustomsDocumentDto,
} from './dto/customs.dto';

@ApiTags(SWAGGER_TAG.Logistique)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customs-declarations')
export class CustomsDeclarationsController {
  constructor(
    private readonly customsDeclarationsService: CustomsDeclarationsService,
  ) {}

  @Get()
  @RequirePermissions('shipments.read')
  @ApiOperation({
    summary: 'List customs declarations',
    description: 'Search declarationNumber; filter status and shipmentId.',
  })
  @ApiPaginatedResponse(CustomsDeclarationResponseDto)
  findAll(
    @Query() query: ListCustomsDeclarationsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<CustomsDeclarationResponseDto>> {
    return this.customsDeclarationsService.findAll(
      query,
      organizationId,
      user,
    );
  }

  @Get(':id')
  @RequirePermissions('shipments.read')
  @ApiOperation({ summary: 'Get a customs declaration' })
  @ApiOkResponse({ type: CustomsDeclarationResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomsDeclarationResponseDto> {
    return this.customsDeclarationsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('shipments.write')
  @ApiOperation({
    summary: 'Create a customs declaration',
    description: 'Starts in draft unless status is provided. Soft-delete supported.',
  })
  @ApiCreatedResponse({ type: CustomsDeclarationResponseDto })
  create(
    @Body() dto: CreateCustomsDeclarationDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomsDeclarationResponseDto> {
    return this.customsDeclarationsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('shipments.write')
  @ApiOperation({ summary: 'Update a customs declaration' })
  @ApiOkResponse({ type: CustomsDeclarationResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomsDeclarationDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomsDeclarationResponseDto> {
    return this.customsDeclarationsService.update(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id')
  @RequirePermissions('shipments.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a customs declaration' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.customsDeclarationsService.remove(id, organizationId, user);
  }

  @Get(':id/documents')
  @RequirePermissions('shipments.read')
  @ApiOperation({ summary: 'List customs document links' })
  @ApiOkResponse({ type: [CustomsDocumentResponseDto] })
  listDocuments(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomsDocumentResponseDto[]> {
    return this.customsDeclarationsService.listDocuments(
      id,
      organizationId,
      user,
    );
  }

  @Post(':id/documents')
  @RequirePermissions('shipments.write')
  @ApiOperation({
    summary: 'Link a document to a customs declaration',
    description: 'Document must exist, same org, not soft-deleted.',
  })
  @ApiCreatedResponse({ type: CustomsDocumentResponseDto })
  addDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCustomsDocumentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomsDocumentResponseDto> {
    return this.customsDeclarationsService.addDocument(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Patch(':id/documents/:linkId')
  @RequirePermissions('shipments.write')
  @ApiOperation({ summary: 'Update a customs document link' })
  @ApiOkResponse({ type: CustomsDocumentResponseDto })
  updateDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Body() dto: UpdateCustomsDocumentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomsDocumentResponseDto> {
    return this.customsDeclarationsService.updateDocument(
      id,
      linkId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/documents/:linkId')
  @RequirePermissions('shipments.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a customs document link' })
  @ApiNoContentResponse()
  removeDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.customsDeclarationsService.removeDocument(
      id,
      linkId,
      organizationId,
      user,
    );
  }
}
