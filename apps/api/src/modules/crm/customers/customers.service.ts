import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  isNull,
  like,
  or,
  type SQL,
} from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  customer_addresses,
  customer_categories,
  customer_contacts,
  customer_notes,
  customers,
} from '../../../database/schema';
import {
  isMysqlDuplicateError,
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import {
  fromBool,
  nowMysqlDateTime,
} from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../crm-scope';
import { CreateCustomerDto, type CustomerStatus, type CustomerType } from './dto/create-customer.dto';
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
  type AddressType,
} from './dto/customer-nested.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  toCustomerAddressResponse,
  toCustomerContactResponse,
  toCustomerNoteResponse,
  toCustomerResponse,
  type CustomerAddressRow,
  type CustomerContactRow,
  type CustomerNoteRow,
  type CustomerRow,
} from './customers.mapper';

@Injectable()
export class CustomersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListCustomersQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<CustomerResponseDto>> {
    const {
      page,
      pageSize,
      search,
      organizationId,
      status,
      type,
      categoryId,
      ownerUserId,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      status,
      type,
      categoryId,
      ownerUserId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(customers).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(customers)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(asc(customers.code)).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as CustomerRow[]).map((row) => toCustomerResponse(row)),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerResponseDto> {
    const row = await this.requireCustomerAccess(
      id,
      currentOrganizationId,
      user,
    );
    const [contacts, addresses, notes] = await Promise.all([
      this.loadContacts(id),
      this.loadAddresses(id),
      this.loadNotes(id),
    ]);
    return toCustomerResponse(row, {
      contacts: contacts.map(toCustomerContactResponse),
      addresses: addresses.map(toCustomerAddressResponse),
      notes: notes.map(toCustomerNoteResponse),
    });
  }

  async create(
    dto: CreateCustomerDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'customer',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureCategoryInOrg(dto.categoryId, organizationId);

    const id = createId();
    try {
      await this.db.insert(customers).values({
        id,
        organization_id: organizationId,
        category_id: dto.categoryId ?? null,
        code: dto.code.trim().toUpperCase(),
        type: dto.type ?? 'organization',
        name: dto.name.trim(),
        legal_name: dto.legalName ?? null,
        tax_id: dto.taxId ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        website: dto.website ?? null,
        owner_user_id: dto.ownerUserId ?? null,
        status: dto.status ?? 'active',
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Customer code already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid category or owner user reference');
    }

    let primaryAssigned = false;
    if (dto.contacts?.length) {
      for (const contact of dto.contacts) {
        const makePrimary = contact.isPrimary === true && !primaryAssigned;
        await this.insertContact(id, {
          ...contact,
          isPrimary: makePrimary,
        });
        if (makePrimary) primaryAssigned = true;
      }
    }

    let defaultAssigned = false;
    if (dto.addresses?.length) {
      for (const address of dto.addresses) {
        const makeDefault = address.isDefault === true && !defaultAssigned;
        await this.insertAddress(id, {
          ...address,
          isDefault: makeDefault,
        });
        if (makeDefault) defaultAssigned = true;
      }
    }

    if (dto.notes?.length) {
      for (const note of dto.notes) {
        await this.insertNote(id, note, user?.id ?? null);
      }
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerResponseDto> {
    const existing = await this.requireCustomerAccess(
      id,
      currentOrganizationId,
      user,
    );

    if (dto.organizationId !== undefined) {
      assertOrgAccess(
        dto.organizationId,
        currentOrganizationId,
        user,
        'customer',
      );
      await ensureOrganizationExists(this.db, dto.organizationId);
    }

    const orgId = dto.organizationId ?? existing.organization_id;
    if (dto.categoryId !== undefined) {
      await this.ensureCategoryInOrg(dto.categoryId, orgId);
    }

    const patch: Partial<{
      organization_id: string;
      category_id: string | null;
      code: string;
      type: CustomerType;
      name: string;
      legal_name: string | null;
      tax_id: string | null;
      email: string | null;
      phone: string | null;
      website: string | null;
      owner_user_id: string | null;
      status: CustomerStatus;
      updated_at: string;
      updated_by: string | null;
    }> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };

    if (dto.organizationId !== undefined)
      patch.organization_id = dto.organizationId;
    if (dto.categoryId !== undefined) patch.category_id = dto.categoryId;
    if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
    if (dto.type !== undefined) patch.type = dto.type;
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.legalName !== undefined) patch.legal_name = dto.legalName;
    if (dto.taxId !== undefined) patch.tax_id = dto.taxId;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.website !== undefined) patch.website = dto.website;
    if (dto.ownerUserId !== undefined) patch.owner_user_id = dto.ownerUserId;
    if (dto.status !== undefined) patch.status = dto.status;

    try {
      await this.db.update(customers).set(patch).where(eq(customers.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Customer code already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid category or owner user reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireCustomerAccess(id, currentOrganizationId, user);
    await this.db
      .update(customers)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(customers.id, id));
  }

  // --- Contacts ---

  async listContacts(
    customerId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerContactResponseDto[]> {
    await this.requireCustomerAccess(
      customerId,
      currentOrganizationId,
      user,
    );
    const rows = await this.loadContacts(customerId);
    return rows.map(toCustomerContactResponse);
  }

  async addContact(
    customerId: string,
    dto: CreateCustomerContactDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerContactResponseDto> {
    await this.requireCustomerAccess(
      customerId,
      currentOrganizationId,
      user,
    );
    if (dto.isPrimary) {
      await this.clearPrimaryContacts(customerId);
    }
    const id = await this.insertContact(customerId, dto);
    return this.findContact(customerId, id);
  }

  async updateContact(
    customerId: string,
    contactId: string,
    dto: UpdateCustomerContactDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerContactResponseDto> {
    await this.requireCustomerAccess(
      customerId,
      currentOrganizationId,
      user,
    );
    await this.findContactRow(customerId, contactId);

    if (dto.isPrimary === true) {
      await this.clearPrimaryContacts(customerId);
    }

    const patch: Partial<{
      first_name: string;
      last_name: string;
      title: string | null;
      email: string | null;
      phone: string | null;
      is_primary: number;
      is_decision_maker: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.firstName !== undefined) patch.first_name = dto.firstName.trim();
    if (dto.lastName !== undefined) patch.last_name = dto.lastName.trim();
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.isPrimary !== undefined) patch.is_primary = fromBool(dto.isPrimary);
    if (dto.isDecisionMaker !== undefined)
      patch.is_decision_maker = fromBool(dto.isDecisionMaker);

    await this.db
      .update(customer_contacts)
      .set(patch)
      .where(eq(customer_contacts.id, contactId));

    return this.findContact(customerId, contactId);
  }

  async removeContact(
    customerId: string,
    contactId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireCustomerAccess(
      customerId,
      currentOrganizationId,
      user,
    );
    await this.findContactRow(customerId, contactId);
    await this.db
      .update(customer_contacts)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(customer_contacts.id, contactId));
  }

  // --- Addresses ---

  async listAddresses(
    customerId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerAddressResponseDto[]> {
    await this.requireCustomerAccess(
      customerId,
      currentOrganizationId,
      user,
    );
    const rows = await this.loadAddresses(customerId);
    return rows.map(toCustomerAddressResponse);
  }

  async addAddress(
    customerId: string,
    dto: CreateCustomerAddressDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerAddressResponseDto> {
    await this.requireCustomerAccess(
      customerId,
      currentOrganizationId,
      user,
    );
    if (dto.isDefault) {
      await this.clearDefaultAddresses(customerId);
    }
    try {
      const id = await this.insertAddress(customerId, dto);
      return await this.findAddress(customerId, id);
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid city or country reference');
    }
  }

  async updateAddress(
    customerId: string,
    addressId: string,
    dto: UpdateCustomerAddressDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerAddressResponseDto> {
    await this.requireCustomerAccess(
      customerId,
      currentOrganizationId,
      user,
    );
    await this.findAddressRow(customerId, addressId);

    if (dto.isDefault === true) {
      await this.clearDefaultAddresses(customerId);
    }

    const patch: Partial<{
      type: AddressType;
      label: string | null;
      line1: string;
      line2: string | null;
      city_id: string | null;
      country_id: string | null;
      postal_code: string | null;
      is_default: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.type !== undefined) patch.type = dto.type;
    if (dto.label !== undefined) patch.label = dto.label;
    if (dto.line1 !== undefined) patch.line1 = dto.line1.trim();
    if (dto.line2 !== undefined) patch.line2 = dto.line2;
    if (dto.cityId !== undefined) patch.city_id = dto.cityId;
    if (dto.countryId !== undefined) patch.country_id = dto.countryId;
    if (dto.postalCode !== undefined) patch.postal_code = dto.postalCode;
    if (dto.isDefault !== undefined) patch.is_default = fromBool(dto.isDefault);

    try {
      await this.db
        .update(customer_addresses)
        .set(patch)
        .where(eq(customer_addresses.id, addressId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid city or country reference');
    }

    return this.findAddress(customerId, addressId);
  }

  async removeAddress(
    customerId: string,
    addressId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireCustomerAccess(
      customerId,
      currentOrganizationId,
      user,
    );
    await this.findAddressRow(customerId, addressId);
    await this.db
      .update(customer_addresses)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(customer_addresses.id, addressId));
  }

  // --- Notes ---

  async listNotes(
    customerId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerNoteResponseDto[]> {
    await this.requireCustomerAccess(
      customerId,
      currentOrganizationId,
      user,
    );
    const rows = await this.loadNotes(customerId);
    return rows.map(toCustomerNoteResponse);
  }

  async addNote(
    customerId: string,
    dto: CreateCustomerNoteDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerNoteResponseDto> {
    await this.requireCustomerAccess(
      customerId,
      currentOrganizationId,
      user,
    );
    const id = await this.insertNote(customerId, dto, user?.id ?? null);
    return this.findNote(customerId, id);
  }

  async updateNote(
    customerId: string,
    noteId: string,
    dto: UpdateCustomerNoteDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerNoteResponseDto> {
    await this.requireCustomerAccess(
      customerId,
      currentOrganizationId,
      user,
    );
    await this.findNoteRow(customerId, noteId);

    const patch: Partial<{
      note: string;
      is_pinned: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.note !== undefined) patch.note = dto.note;
    if (dto.isPinned !== undefined) patch.is_pinned = fromBool(dto.isPinned);

    await this.db
      .update(customer_notes)
      .set(patch)
      .where(eq(customer_notes.id, noteId));

    return this.findNote(customerId, noteId);
  }

  async removeNote(
    customerId: string,
    noteId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireCustomerAccess(
      customerId,
      currentOrganizationId,
      user,
    );
    await this.findNoteRow(customerId, noteId);
    await this.db
      .update(customer_notes)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(customer_notes.id, noteId));
  }

  private async requireCustomerAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerRow> {
    const row = await this.findActiveRowById(id);
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'customer',
    );
    return row;
  }

  private async findActiveRowById(id: string): Promise<CustomerRow> {
    const [row] = await this.db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), isNull(customers.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return row as CustomerRow;
  }

  private async ensureCategoryInOrg(
    categoryId: string | null | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!categoryId) return;

    const [row] = await this.db
      .select({ id: customer_categories.id })
      .from(customer_categories)
      .where(
        and(
          eq(customer_categories.id, categoryId),
          eq(customer_categories.organization_id, organizationId),
          isNull(customer_categories.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new BadRequestException(
        'categoryId must belong to the same organization',
      );
    }
  }

  private async insertContact(
    customerId: string,
    dto: CreateCustomerContactDto,
  ): Promise<string> {
    const id = createId();
    await this.db.insert(customer_contacts).values({
      id,
      customer_id: customerId,
      first_name: dto.firstName.trim(),
      last_name: dto.lastName.trim(),
      title: dto.title ?? null,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      is_primary: fromBool(dto.isPrimary ?? false),
      is_decision_maker: fromBool(dto.isDecisionMaker ?? false),
    });
    return id;
  }

  private async insertAddress(
    customerId: string,
    dto: CreateCustomerAddressDto,
  ): Promise<string> {
    const id = createId();
    await this.db.insert(customer_addresses).values({
      id,
      customer_id: customerId,
      type: dto.type ?? 'both',
      label: dto.label ?? null,
      line1: dto.line1.trim(),
      line2: dto.line2 ?? null,
      city_id: dto.cityId ?? null,
      country_id: dto.countryId ?? null,
      postal_code: dto.postalCode ?? null,
      is_default: fromBool(dto.isDefault ?? false),
    });
    return id;
  }

  private async insertNote(
    customerId: string,
    dto: CreateCustomerNoteDto,
    authorId: string | null,
  ): Promise<string> {
    const id = createId();
    await this.db.insert(customer_notes).values({
      id,
      customer_id: customerId,
      author_id: authorId,
      note: dto.note,
      is_pinned: fromBool(dto.isPinned ?? false),
    });
    return id;
  }

  private async clearPrimaryContacts(customerId: string): Promise<void> {
    await this.db
      .update(customer_contacts)
      .set({ is_primary: 0, updated_at: nowMysqlDateTime() })
      .where(
        and(
          eq(customer_contacts.customer_id, customerId),
          isNull(customer_contacts.deleted_at),
        ),
      );
  }

  private async clearDefaultAddresses(customerId: string): Promise<void> {
    await this.db
      .update(customer_addresses)
      .set({ is_default: 0, updated_at: nowMysqlDateTime() })
      .where(
        and(
          eq(customer_addresses.customer_id, customerId),
          isNull(customer_addresses.deleted_at),
        ),
      );
  }

  private async loadContacts(
    customerId: string,
  ): Promise<CustomerContactRow[]> {
    const rows = await this.db
      .select()
      .from(customer_contacts)
      .where(
        and(
          eq(customer_contacts.customer_id, customerId),
          isNull(customer_contacts.deleted_at),
        ),
      )
      .orderBy(
        desc(customer_contacts.is_primary),
        asc(customer_contacts.last_name),
        asc(customer_contacts.first_name),
      );
    return rows as CustomerContactRow[];
  }

  private async loadAddresses(
    customerId: string,
  ): Promise<CustomerAddressRow[]> {
    const rows = await this.db
      .select()
      .from(customer_addresses)
      .where(
        and(
          eq(customer_addresses.customer_id, customerId),
          isNull(customer_addresses.deleted_at),
        ),
      )
      .orderBy(
        desc(customer_addresses.is_default),
        asc(customer_addresses.line1),
      );
    return rows as CustomerAddressRow[];
  }

  private async loadNotes(customerId: string): Promise<CustomerNoteRow[]> {
    const rows = await this.db
      .select()
      .from(customer_notes)
      .where(
        and(
          eq(customer_notes.customer_id, customerId),
          isNull(customer_notes.deleted_at),
        ),
      )
      .orderBy(desc(customer_notes.is_pinned), desc(customer_notes.created_at));
    return rows as CustomerNoteRow[];
  }

  private async findContact(
    customerId: string,
    contactId: string,
  ): Promise<CustomerContactResponseDto> {
    return toCustomerContactResponse(
      await this.findContactRow(customerId, contactId),
    );
  }

  private async findContactRow(
    customerId: string,
    contactId: string,
  ): Promise<CustomerContactRow> {
    const [row] = await this.db
      .select()
      .from(customer_contacts)
      .where(
        and(
          eq(customer_contacts.id, contactId),
          eq(customer_contacts.customer_id, customerId),
          isNull(customer_contacts.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Customer contact ${contactId} not found`);
    }
    return row as CustomerContactRow;
  }

  private async findAddress(
    customerId: string,
    addressId: string,
  ): Promise<CustomerAddressResponseDto> {
    return toCustomerAddressResponse(
      await this.findAddressRow(customerId, addressId),
    );
  }

  private async findAddressRow(
    customerId: string,
    addressId: string,
  ): Promise<CustomerAddressRow> {
    const [row] = await this.db
      .select()
      .from(customer_addresses)
      .where(
        and(
          eq(customer_addresses.id, addressId),
          eq(customer_addresses.customer_id, customerId),
          isNull(customer_addresses.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Customer address ${addressId} not found`);
    }
    return row as CustomerAddressRow;
  }

  private async findNote(
    customerId: string,
    noteId: string,
  ): Promise<CustomerNoteResponseDto> {
    return toCustomerNoteResponse(await this.findNoteRow(customerId, noteId));
  }

  private async findNoteRow(
    customerId: string,
    noteId: string,
  ): Promise<CustomerNoteRow> {
    const [row] = await this.db
      .select()
      .from(customer_notes)
      .where(
        and(
          eq(customer_notes.id, noteId),
          eq(customer_notes.customer_id, customerId),
          isNull(customer_notes.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Customer note ${noteId} not found`);
    }
    return row as CustomerNoteRow;
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    status?: string;
    type?: string;
    categoryId?: string;
    ownerUserId?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(customers.organization_id, params.organizationId),
      isNull(customers.deleted_at),
    ];
    if (params.search) {
      parts.push(
        or(
          like(customers.code, `%${params.search}%`),
          like(customers.name, `%${params.search}%`),
          like(customers.email, `%${params.search}%`),
        )!,
      );
    }
    if (params.status) {
      parts.push(
        eq(
          customers.status,
          params.status as 'active' | 'inactive' | 'blocked',
        ),
      );
    }
    if (params.type) {
      parts.push(
        eq(
          customers.type,
          params.type as 'individual' | 'organization',
        ),
      );
    }
    if (params.categoryId) {
      parts.push(eq(customers.category_id, params.categoryId));
    }
    if (params.ownerUserId) {
      parts.push(eq(customers.owner_user_id, params.ownerUserId));
    }
    return and(...parts)!;
  }
}
