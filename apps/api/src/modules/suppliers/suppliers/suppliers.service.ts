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
  payment_terms,
  supplier_addresses,
  supplier_categories,
  supplier_contacts,
  supplier_payment_terms,
  suppliers,
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
} from '../suppliers-scope';
import { CreateSupplierDto, type SupplierStatus } from './dto/create-supplier.dto';
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
  type SupplierAddressType,
} from './dto/supplier-nested.dto';
import { SupplierResponseDto } from './dto/supplier-response.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import {
  toSupplierAddressResponse,
  toSupplierContactResponse,
  toSupplierPaymentTermResponse,
  toSupplierResponse,
  type SupplierAddressRow,
  type SupplierContactRow,
  type SupplierPaymentTermRow,
  type SupplierRow,
} from './suppliers.mapper';

@Injectable()
export class SuppliersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListSuppliersQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<SupplierResponseDto>> {
    const {
      page,
      pageSize,
      search,
      organizationId,
      status,
      categoryId,
      preferred,
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
      categoryId,
      preferred,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(suppliers).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(suppliers)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(asc(suppliers.code)).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as SupplierRow[]).map((row) => toSupplierResponse(row)),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierResponseDto> {
    const row = await this.requireSupplierAccess(
      id,
      currentOrganizationId,
      user,
    );
    const [contacts, addresses, paymentTerms] = await Promise.all([
      this.loadContacts(id),
      this.loadAddresses(id),
      this.loadPaymentTerms(id),
    ]);
    return toSupplierResponse(row, {
      contacts: contacts.map(toSupplierContactResponse),
      addresses: addresses.map(toSupplierAddressResponse),
      paymentTerms: paymentTerms.map(toSupplierPaymentTermResponse),
    });
  }

  async create(
    dto: CreateSupplierDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'supplier',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureCategoryInOrg(dto.categoryId, organizationId);

    const id = createId();
    try {
      await this.db.insert(suppliers).values({
        id,
        organization_id: organizationId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        category_id: dto.categoryId ?? null,
        country_id: dto.countryId ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        website: dto.website ?? null,
        tax_id: dto.taxId ?? null,
        rating: dto.rating ?? null,
        status: dto.status ?? 'active',
        preferred: fromBool(dto.preferred ?? false),
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Supplier code already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid category or country reference');
    }

    let primaryAssigned = false;
    if (dto.contacts?.length) {
      for (const contact of dto.contacts) {
        const makePrimary = contact.isPrimary === true && !primaryAssigned;
        await this.insertContact(id, { ...contact, isPrimary: makePrimary });
        if (makePrimary) primaryAssigned = true;
      }
    }

    let defaultAddressAssigned = false;
    if (dto.addresses?.length) {
      for (const address of dto.addresses) {
        const makeDefault =
          address.isDefault === true && !defaultAddressAssigned;
        await this.insertAddress(id, { ...address, isDefault: makeDefault });
        if (makeDefault) defaultAddressAssigned = true;
      }
    }

    let defaultTermAssigned = false;
    if (dto.paymentTerms?.length) {
      for (const term of dto.paymentTerms) {
        await this.ensurePaymentTermAccessible(term.paymentTermId, organizationId);
        const makeDefault = term.isDefault === true && !defaultTermAssigned;
        await this.insertPaymentTerm(id, { ...term, isDefault: makeDefault });
        if (makeDefault) defaultTermAssigned = true;
      }
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateSupplierDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierResponseDto> {
    const existing = await this.requireSupplierAccess(
      id,
      currentOrganizationId,
      user,
    );

    if (dto.organizationId !== undefined) {
      assertOrgAccess(
        dto.organizationId,
        currentOrganizationId,
        user,
        'supplier',
      );
      await ensureOrganizationExists(this.db, dto.organizationId);
    }

    const orgId = dto.organizationId ?? existing.organization_id;
    if (dto.categoryId !== undefined) {
      await this.ensureCategoryInOrg(dto.categoryId, orgId);
    }

    const patch: Partial<{
      organization_id: string;
      code: string;
      name: string;
      category_id: string | null;
      country_id: string | null;
      email: string | null;
      phone: string | null;
      website: string | null;
      tax_id: string | null;
      rating: string | null;
      status: SupplierStatus;
      preferred: number;
      updated_at: string;
      updated_by: string | null;
    }> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };

    if (dto.organizationId !== undefined)
      patch.organization_id = dto.organizationId;
    if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.categoryId !== undefined) patch.category_id = dto.categoryId;
    if (dto.countryId !== undefined) patch.country_id = dto.countryId;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.website !== undefined) patch.website = dto.website;
    if (dto.taxId !== undefined) patch.tax_id = dto.taxId;
    if (dto.rating !== undefined) patch.rating = dto.rating;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.preferred !== undefined) patch.preferred = fromBool(dto.preferred);

    try {
      await this.db.update(suppliers).set(patch).where(eq(suppliers.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Supplier code already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid category or country reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireSupplierAccess(id, currentOrganizationId, user);
    await this.db
      .update(suppliers)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(suppliers.id, id));
  }

  // --- Contacts ---

  async listContacts(
    supplierId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierContactResponseDto[]> {
    await this.requireSupplierAccess(supplierId, currentOrganizationId, user);
    return (await this.loadContacts(supplierId)).map(toSupplierContactResponse);
  }

  async addContact(
    supplierId: string,
    dto: CreateSupplierContactDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierContactResponseDto> {
    await this.requireSupplierAccess(supplierId, currentOrganizationId, user);
    if (dto.isPrimary) await this.clearPrimaryContacts(supplierId);
    const id = await this.insertContact(supplierId, dto);
    return this.findContact(supplierId, id);
  }

  async updateContact(
    supplierId: string,
    contactId: string,
    dto: UpdateSupplierContactDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierContactResponseDto> {
    await this.requireSupplierAccess(supplierId, currentOrganizationId, user);
    await this.findContactRow(supplierId, contactId);
    if (dto.isPrimary === true) await this.clearPrimaryContacts(supplierId);

    const patch: Partial<{
      first_name: string;
      last_name: string;
      title: string | null;
      email: string | null;
      phone: string | null;
      is_primary: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.firstName !== undefined) patch.first_name = dto.firstName.trim();
    if (dto.lastName !== undefined) patch.last_name = dto.lastName.trim();
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.isPrimary !== undefined) patch.is_primary = fromBool(dto.isPrimary);

    await this.db
      .update(supplier_contacts)
      .set(patch)
      .where(eq(supplier_contacts.id, contactId));

    return this.findContact(supplierId, contactId);
  }

  async removeContact(
    supplierId: string,
    contactId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireSupplierAccess(supplierId, currentOrganizationId, user);
    await this.findContactRow(supplierId, contactId);
    await this.db
      .update(supplier_contacts)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(supplier_contacts.id, contactId));
  }

  // --- Addresses ---

  async listAddresses(
    supplierId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierAddressResponseDto[]> {
    await this.requireSupplierAccess(supplierId, currentOrganizationId, user);
    return (await this.loadAddresses(supplierId)).map(
      toSupplierAddressResponse,
    );
  }

  async addAddress(
    supplierId: string,
    dto: CreateSupplierAddressDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierAddressResponseDto> {
    await this.requireSupplierAccess(supplierId, currentOrganizationId, user);
    if (dto.isDefault) await this.clearDefaultAddresses(supplierId);
    try {
      const id = await this.insertAddress(supplierId, dto);
      return await this.findAddress(supplierId, id);
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid city or country reference');
    }
  }

  async updateAddress(
    supplierId: string,
    addressId: string,
    dto: UpdateSupplierAddressDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierAddressResponseDto> {
    await this.requireSupplierAccess(supplierId, currentOrganizationId, user);
    await this.findAddressRow(supplierId, addressId);
    if (dto.isDefault === true) await this.clearDefaultAddresses(supplierId);

    const patch: Partial<{
      type: SupplierAddressType;
      line1: string;
      line2: string | null;
      city_id: string | null;
      country_id: string | null;
      is_default: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.type !== undefined) patch.type = dto.type;
    if (dto.line1 !== undefined) patch.line1 = dto.line1.trim();
    if (dto.line2 !== undefined) patch.line2 = dto.line2;
    if (dto.cityId !== undefined) patch.city_id = dto.cityId;
    if (dto.countryId !== undefined) patch.country_id = dto.countryId;
    if (dto.isDefault !== undefined) patch.is_default = fromBool(dto.isDefault);

    try {
      await this.db
        .update(supplier_addresses)
        .set(patch)
        .where(eq(supplier_addresses.id, addressId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid city or country reference');
    }

    return this.findAddress(supplierId, addressId);
  }

  async removeAddress(
    supplierId: string,
    addressId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireSupplierAccess(supplierId, currentOrganizationId, user);
    await this.findAddressRow(supplierId, addressId);
    await this.db
      .update(supplier_addresses)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(supplier_addresses.id, addressId));
  }

  // --- Payment terms ---

  async listPaymentTerms(
    supplierId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierPaymentTermResponseDto[]> {
    await this.requireSupplierAccess(supplierId, currentOrganizationId, user);
    return (await this.loadPaymentTerms(supplierId)).map(
      toSupplierPaymentTermResponse,
    );
  }

  async addPaymentTerm(
    supplierId: string,
    dto: CreateSupplierPaymentTermDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierPaymentTermResponseDto> {
    const supplier = await this.requireSupplierAccess(
      supplierId,
      currentOrganizationId,
      user,
    );
    await this.ensurePaymentTermAccessible(
      dto.paymentTermId,
      supplier.organization_id,
    );
    if (dto.isDefault) await this.clearDefaultPaymentTerms(supplierId);
    try {
      const id = await this.insertPaymentTerm(supplierId, dto);
      return await this.findPaymentTerm(supplierId, id);
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid payment term reference');
    }
  }

  async updatePaymentTerm(
    supplierId: string,
    termId: string,
    dto: UpdateSupplierPaymentTermDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierPaymentTermResponseDto> {
    const supplier = await this.requireSupplierAccess(
      supplierId,
      currentOrganizationId,
      user,
    );
    await this.findPaymentTermRow(supplierId, termId);

    if (dto.paymentTermId !== undefined) {
      await this.ensurePaymentTermAccessible(
        dto.paymentTermId,
        supplier.organization_id,
      );
    }
    if (dto.isDefault === true) await this.clearDefaultPaymentTerms(supplierId);

    const patch: Partial<{
      payment_term_id: string;
      is_default: number;
      notes: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.paymentTermId !== undefined)
      patch.payment_term_id = dto.paymentTermId;
    if (dto.isDefault !== undefined) patch.is_default = fromBool(dto.isDefault);
    if (dto.notes !== undefined) patch.notes = dto.notes;

    try {
      await this.db
        .update(supplier_payment_terms)
        .set(patch)
        .where(eq(supplier_payment_terms.id, termId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid payment term reference');
    }

    return this.findPaymentTerm(supplierId, termId);
  }

  async removePaymentTerm(
    supplierId: string,
    termId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireSupplierAccess(supplierId, currentOrganizationId, user);
    await this.findPaymentTermRow(supplierId, termId);
    await this.db
      .delete(supplier_payment_terms)
      .where(eq(supplier_payment_terms.id, termId));
  }

  private async requireSupplierAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierRow> {
    const row = await this.findActiveRowById(id);
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'supplier',
    );
    return row;
  }

  private async findActiveRowById(id: string): Promise<SupplierRow> {
    const [row] = await this.db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), isNull(suppliers.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Supplier ${id} not found`);
    }
    return row as SupplierRow;
  }

  private async ensureCategoryInOrg(
    categoryId: string | null | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!categoryId) return;
    const [row] = await this.db
      .select({ id: supplier_categories.id })
      .from(supplier_categories)
      .where(
        and(
          eq(supplier_categories.id, categoryId),
          eq(supplier_categories.organization_id, organizationId),
          isNull(supplier_categories.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new BadRequestException(
        'categoryId must belong to the same organization',
      );
    }
  }

  private async ensurePaymentTermAccessible(
    paymentTermId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: payment_terms.id })
      .from(payment_terms)
      .where(
        and(
          eq(payment_terms.id, paymentTermId),
          isNull(payment_terms.deleted_at),
          or(
            isNull(payment_terms.organization_id),
            eq(payment_terms.organization_id, organizationId),
          ),
        ),
      )
      .limit(1);
    if (!row) {
      throw new BadRequestException(
        'paymentTermId must be a global or organization payment term',
      );
    }
  }

  private async insertContact(
    supplierId: string,
    dto: CreateSupplierContactDto,
  ): Promise<string> {
    const id = createId();
    await this.db.insert(supplier_contacts).values({
      id,
      supplier_id: supplierId,
      first_name: dto.firstName.trim(),
      last_name: dto.lastName.trim(),
      title: dto.title ?? null,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      is_primary: fromBool(dto.isPrimary ?? false),
    });
    return id;
  }

  private async insertAddress(
    supplierId: string,
    dto: CreateSupplierAddressDto,
  ): Promise<string> {
    const id = createId();
    await this.db.insert(supplier_addresses).values({
      id,
      supplier_id: supplierId,
      type: dto.type ?? 'hq',
      line1: dto.line1.trim(),
      line2: dto.line2 ?? null,
      city_id: dto.cityId ?? null,
      country_id: dto.countryId ?? null,
      is_default: fromBool(dto.isDefault ?? false),
    });
    return id;
  }

  private async insertPaymentTerm(
    supplierId: string,
    dto: CreateSupplierPaymentTermDto,
  ): Promise<string> {
    const id = createId();
    await this.db.insert(supplier_payment_terms).values({
      id,
      supplier_id: supplierId,
      payment_term_id: dto.paymentTermId,
      is_default: fromBool(dto.isDefault ?? false),
      notes: dto.notes ?? null,
    });
    return id;
  }

  private async clearPrimaryContacts(supplierId: string): Promise<void> {
    await this.db
      .update(supplier_contacts)
      .set({ is_primary: 0, updated_at: nowMysqlDateTime() })
      .where(
        and(
          eq(supplier_contacts.supplier_id, supplierId),
          isNull(supplier_contacts.deleted_at),
        ),
      );
  }

  private async clearDefaultAddresses(supplierId: string): Promise<void> {
    await this.db
      .update(supplier_addresses)
      .set({ is_default: 0, updated_at: nowMysqlDateTime() })
      .where(
        and(
          eq(supplier_addresses.supplier_id, supplierId),
          isNull(supplier_addresses.deleted_at),
        ),
      );
  }

  private async clearDefaultPaymentTerms(supplierId: string): Promise<void> {
    await this.db
      .update(supplier_payment_terms)
      .set({ is_default: 0, updated_at: nowMysqlDateTime() })
      .where(eq(supplier_payment_terms.supplier_id, supplierId));
  }

  private async loadContacts(supplierId: string): Promise<SupplierContactRow[]> {
    const rows = await this.db
      .select()
      .from(supplier_contacts)
      .where(
        and(
          eq(supplier_contacts.supplier_id, supplierId),
          isNull(supplier_contacts.deleted_at),
        ),
      )
      .orderBy(
        desc(supplier_contacts.is_primary),
        asc(supplier_contacts.last_name),
        asc(supplier_contacts.first_name),
      );
    return rows as SupplierContactRow[];
  }

  private async loadAddresses(
    supplierId: string,
  ): Promise<SupplierAddressRow[]> {
    const rows = await this.db
      .select()
      .from(supplier_addresses)
      .where(
        and(
          eq(supplier_addresses.supplier_id, supplierId),
          isNull(supplier_addresses.deleted_at),
        ),
      )
      .orderBy(
        desc(supplier_addresses.is_default),
        asc(supplier_addresses.line1),
      );
    return rows as SupplierAddressRow[];
  }

  private async loadPaymentTerms(
    supplierId: string,
  ): Promise<SupplierPaymentTermRow[]> {
    const rows = await this.db
      .select()
      .from(supplier_payment_terms)
      .where(eq(supplier_payment_terms.supplier_id, supplierId))
      .orderBy(
        desc(supplier_payment_terms.is_default),
        asc(supplier_payment_terms.created_at),
      );
    return rows as SupplierPaymentTermRow[];
  }

  private async findContact(
    supplierId: string,
    contactId: string,
  ): Promise<SupplierContactResponseDto> {
    return toSupplierContactResponse(
      await this.findContactRow(supplierId, contactId),
    );
  }

  private async findContactRow(
    supplierId: string,
    contactId: string,
  ): Promise<SupplierContactRow> {
    const [row] = await this.db
      .select()
      .from(supplier_contacts)
      .where(
        and(
          eq(supplier_contacts.id, contactId),
          eq(supplier_contacts.supplier_id, supplierId),
          isNull(supplier_contacts.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Supplier contact ${contactId} not found`);
    }
    return row as SupplierContactRow;
  }

  private async findAddress(
    supplierId: string,
    addressId: string,
  ): Promise<SupplierAddressResponseDto> {
    return toSupplierAddressResponse(
      await this.findAddressRow(supplierId, addressId),
    );
  }

  private async findAddressRow(
    supplierId: string,
    addressId: string,
  ): Promise<SupplierAddressRow> {
    const [row] = await this.db
      .select()
      .from(supplier_addresses)
      .where(
        and(
          eq(supplier_addresses.id, addressId),
          eq(supplier_addresses.supplier_id, supplierId),
          isNull(supplier_addresses.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Supplier address ${addressId} not found`);
    }
    return row as SupplierAddressRow;
  }

  private async findPaymentTerm(
    supplierId: string,
    termId: string,
  ): Promise<SupplierPaymentTermResponseDto> {
    return toSupplierPaymentTermResponse(
      await this.findPaymentTermRow(supplierId, termId),
    );
  }

  private async findPaymentTermRow(
    supplierId: string,
    termId: string,
  ): Promise<SupplierPaymentTermRow> {
    const [row] = await this.db
      .select()
      .from(supplier_payment_terms)
      .where(
        and(
          eq(supplier_payment_terms.id, termId),
          eq(supplier_payment_terms.supplier_id, supplierId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Supplier payment term ${termId} not found`,
      );
    }
    return row as SupplierPaymentTermRow;
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    status?: SupplierStatus;
    categoryId?: string;
    preferred?: boolean;
  }): SQL {
    const parts: SQL[] = [
      eq(suppliers.organization_id, params.organizationId),
      isNull(suppliers.deleted_at),
    ];
    if (params.search) {
      parts.push(
        or(
          like(suppliers.code, `%${params.search}%`),
          like(suppliers.name, `%${params.search}%`),
          like(suppliers.email, `%${params.search}%`),
        )!,
      );
    }
    if (params.status) {
      parts.push(eq(suppliers.status, params.status));
    }
    if (params.categoryId) {
      parts.push(eq(suppliers.category_id, params.categoryId));
    }
    if (params.preferred !== undefined) {
      parts.push(eq(suppliers.preferred, fromBool(params.preferred)));
    }
    return and(...parts)!;
  }
}
