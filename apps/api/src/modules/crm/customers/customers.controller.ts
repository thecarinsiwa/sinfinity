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
import { CreateCustomerDto } from './dto/create-customer.dto';
import {
  CreateCustomerAddressDto,
  CreateCustomerContactDto,
  CreateCustomerNoteDto,
  CustomerAddressResponseDto,
  CustomerContactResponseDto,
  CustomerNoteResponseDto,
  UpdateCustomerAddressDto,
  UpdateCustomerContactDto,
  UpdateCustomerNoteDto,
} from './dto/customer-nested.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags(SWAGGER_TAG.Crm)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions('customers.read')
  @ApiOperation({
    summary: 'List customers',
    description: 'Search name/code/email; filter status, type, category, owner.',
  })
  @ApiPaginatedResponse(CustomerResponseDto)
  findAll(
    @Query() query: ListCustomersQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<CustomerResponseDto>> {
    return this.customersService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('customers.read')
  @ApiOperation({
    summary: 'Get a customer with contacts, addresses and notes',
  })
  @ApiOkResponse({ type: CustomerResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerResponseDto> {
    return this.customersService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('customers.write')
  @ApiOperation({
    summary: 'Create a customer',
    description: 'Code unique per organization. Optional nested contacts/addresses/notes.',
  })
  @ApiCreatedResponse({ type: CustomerResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateCustomerDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerResponseDto> {
    return this.customersService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('customers.write')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiOkResponse({ type: CustomerResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerResponseDto> {
    return this.customersService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('customers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a customer' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.customersService.remove(id, organizationId, user);
  }

  // --- Contacts ---

  @Get(':id/contacts')
  @RequirePermissions('customers.read')
  @ApiOperation({ summary: 'List customer contacts' })
  @ApiOkResponse({ type: [CustomerContactResponseDto] })
  listContacts(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerContactResponseDto[]> {
    return this.customersService.listContacts(id, organizationId, user);
  }

  @Post(':id/contacts')
  @RequirePermissions('customers.write')
  @ApiOperation({
    summary: 'Add a contact',
    description: 'At most one isPrimary contact per customer.',
  })
  @ApiCreatedResponse({ type: CustomerContactResponseDto })
  addContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCustomerContactDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerContactResponseDto> {
    return this.customersService.addContact(id, dto, organizationId, user);
  }

  @Patch(':id/contacts/:contactId')
  @RequirePermissions('customers.write')
  @ApiOperation({ summary: 'Update a contact' })
  @ApiOkResponse({ type: CustomerContactResponseDto })
  updateContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body() dto: UpdateCustomerContactDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerContactResponseDto> {
    return this.customersService.updateContact(
      id,
      contactId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/contacts/:contactId')
  @RequirePermissions('customers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a contact' })
  @ApiNoContentResponse()
  removeContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.customersService.removeContact(
      id,
      contactId,
      organizationId,
      user,
    );
  }

  // --- Addresses ---

  @Get(':id/addresses')
  @RequirePermissions('customers.read')
  @ApiOperation({ summary: 'List customer addresses' })
  @ApiOkResponse({ type: [CustomerAddressResponseDto] })
  listAddresses(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerAddressResponseDto[]> {
    return this.customersService.listAddresses(id, organizationId, user);
  }

  @Post(':id/addresses')
  @RequirePermissions('customers.write')
  @ApiOperation({
    summary: 'Add an address',
    description: 'Type billing/shipping/both. Optional single isDefault.',
  })
  @ApiCreatedResponse({ type: CustomerAddressResponseDto })
  addAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCustomerAddressDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerAddressResponseDto> {
    return this.customersService.addAddress(id, dto, organizationId, user);
  }

  @Patch(':id/addresses/:addressId')
  @RequirePermissions('customers.write')
  @ApiOperation({ summary: 'Update an address' })
  @ApiOkResponse({ type: CustomerAddressResponseDto })
  updateAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() dto: UpdateCustomerAddressDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerAddressResponseDto> {
    return this.customersService.updateAddress(
      id,
      addressId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/addresses/:addressId')
  @RequirePermissions('customers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an address' })
  @ApiNoContentResponse()
  removeAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.customersService.removeAddress(
      id,
      addressId,
      organizationId,
      user,
    );
  }

  // --- Notes ---

  @Get(':id/notes')
  @RequirePermissions('customers.read')
  @ApiOperation({ summary: 'List customer notes' })
  @ApiOkResponse({ type: [CustomerNoteResponseDto] })
  listNotes(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerNoteResponseDto[]> {
    return this.customersService.listNotes(id, organizationId, user);
  }

  @Post(':id/notes')
  @RequirePermissions('customers.write')
  @ApiOperation({
    summary: 'Add a note',
    description: 'authorId is set from the current user.',
  })
  @ApiCreatedResponse({ type: CustomerNoteResponseDto })
  addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCustomerNoteDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerNoteResponseDto> {
    return this.customersService.addNote(id, dto, organizationId, user);
  }

  @Patch(':id/notes/:noteId')
  @RequirePermissions('customers.write')
  @ApiOperation({ summary: 'Update a note' })
  @ApiOkResponse({ type: CustomerNoteResponseDto })
  updateNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() dto: UpdateCustomerNoteDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomerNoteResponseDto> {
    return this.customersService.updateNote(
      id,
      noteId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/notes/:noteId')
  @RequirePermissions('customers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a note' })
  @ApiNoContentResponse()
  removeNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.customersService.removeNote(
      id,
      noteId,
      organizationId,
      user,
    );
  }
}
