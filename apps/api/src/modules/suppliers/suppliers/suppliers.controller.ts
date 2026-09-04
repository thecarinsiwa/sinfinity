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
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListSuppliersQueryDto } from './dto/list-suppliers-query.dto';
import {
  CreateSupplierAddressDto,
  CreateSupplierContactDto,
  CreateSupplierPaymentTermDto,
  SupplierAddressResponseDto,
  SupplierContactResponseDto,
  SupplierPaymentTermResponseDto,
  UpdateSupplierAddressDto,
  UpdateSupplierContactDto,
  UpdateSupplierPaymentTermDto,
} from './dto/supplier-nested.dto';
import { SupplierResponseDto } from './dto/supplier-response.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags(SWAGGER_TAG.Fournisseurs)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermissions('suppliers.read')
  @ApiOperation({
    summary: 'List suppliers',
    description: 'Search code/name/email; filter status, category, preferred.',
  })
  @ApiPaginatedResponse(SupplierResponseDto)
  findAll(
    @Query() query: ListSuppliersQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<SupplierResponseDto>> {
    return this.suppliersService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('suppliers.read')
  @ApiOperation({
    summary: 'Get a supplier with contacts, addresses and payment terms',
  })
  @ApiOkResponse({ type: SupplierResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierResponseDto> {
    return this.suppliersService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('suppliers.write')
  @ApiOperation({
    summary: 'Create a supplier',
    description:
      'Code unique per organization. Optional nested contacts/addresses/paymentTerms.',
  })
  @ApiCreatedResponse({ type: SupplierResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateSupplierDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierResponseDto> {
    return this.suppliersService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Update a supplier' })
  @ApiOkResponse({ type: SupplierResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierResponseDto> {
    return this.suppliersService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('suppliers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a supplier' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.suppliersService.remove(id, organizationId, user);
  }

  // --- Contacts ---

  @Get(':id/contacts')
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'List supplier contacts' })
  @ApiOkResponse({ type: [SupplierContactResponseDto] })
  listContacts(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierContactResponseDto[]> {
    return this.suppliersService.listContacts(id, organizationId, user);
  }

  @Post(':id/contacts')
  @RequirePermissions('suppliers.write')
  @ApiOperation({
    summary: 'Add a contact',
    description: 'At most one isPrimary contact per supplier.',
  })
  @ApiCreatedResponse({ type: SupplierContactResponseDto })
  addContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSupplierContactDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierContactResponseDto> {
    return this.suppliersService.addContact(id, dto, organizationId, user);
  }

  @Patch(':id/contacts/:contactId')
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Update a contact' })
  @ApiOkResponse({ type: SupplierContactResponseDto })
  updateContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body() dto: UpdateSupplierContactDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierContactResponseDto> {
    return this.suppliersService.updateContact(
      id,
      contactId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/contacts/:contactId')
  @RequirePermissions('suppliers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a contact' })
  @ApiNoContentResponse()
  removeContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.suppliersService.removeContact(
      id,
      contactId,
      organizationId,
      user,
    );
  }

  // --- Addresses ---

  @Get(':id/addresses')
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'List supplier addresses' })
  @ApiOkResponse({ type: [SupplierAddressResponseDto] })
  listAddresses(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierAddressResponseDto[]> {
    return this.suppliersService.listAddresses(id, organizationId, user);
  }

  @Post(':id/addresses')
  @RequirePermissions('suppliers.write')
  @ApiOperation({
    summary: 'Add an address',
    description: 'Type hq/warehouse/factory/billing. Optional single isDefault.',
  })
  @ApiCreatedResponse({ type: SupplierAddressResponseDto })
  addAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSupplierAddressDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierAddressResponseDto> {
    return this.suppliersService.addAddress(id, dto, organizationId, user);
  }

  @Patch(':id/addresses/:addressId')
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Update an address' })
  @ApiOkResponse({ type: SupplierAddressResponseDto })
  updateAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() dto: UpdateSupplierAddressDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierAddressResponseDto> {
    return this.suppliersService.updateAddress(
      id,
      addressId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/addresses/:addressId')
  @RequirePermissions('suppliers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an address' })
  @ApiNoContentResponse()
  removeAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.suppliersService.removeAddress(
      id,
      addressId,
      organizationId,
      user,
    );
  }

  // --- Payment terms ---

  @Get(':id/payment-terms')
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'List supplier payment term links' })
  @ApiOkResponse({ type: [SupplierPaymentTermResponseDto] })
  listPaymentTerms(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierPaymentTermResponseDto[]> {
    return this.suppliersService.listPaymentTerms(id, organizationId, user);
  }

  @Post(':id/payment-terms')
  @RequirePermissions('suppliers.write')
  @ApiOperation({
    summary: 'Link a payment term',
    description: 'Optional single isDefault. Hard-delete on remove.',
  })
  @ApiCreatedResponse({ type: SupplierPaymentTermResponseDto })
  addPaymentTerm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSupplierPaymentTermDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierPaymentTermResponseDto> {
    return this.suppliersService.addPaymentTerm(id, dto, organizationId, user);
  }

  @Patch(':id/payment-terms/:termId')
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Update a payment term link' })
  @ApiOkResponse({ type: SupplierPaymentTermResponseDto })
  updatePaymentTerm(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('termId', ParseUUIDPipe) termId: string,
    @Body() dto: UpdateSupplierPaymentTermDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierPaymentTermResponseDto> {
    return this.suppliersService.updatePaymentTerm(
      id,
      termId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/payment-terms/:termId')
  @RequirePermissions('suppliers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a payment term link' })
  @ApiNoContentResponse()
  removePaymentTerm(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('termId', ParseUUIDPipe) termId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.suppliersService.removePaymentTerm(
      id,
      termId,
      organizationId,
      user,
    );
  }
}
