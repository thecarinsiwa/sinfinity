import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, isNull, like, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  countries,
  currencies,
  organizations,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import {
  fromBool,
  nowMysqlDateTime,
} from '../../settings/utils/mysql-datetime';
import {
  toOrganizationResponse,
  type OrganizationRow,
} from './organizations.mapper';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { ListOrganizationsQueryDto } from './dto/list-organizations-query.dto';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListOrganizationsQueryDto,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<OrganizationResponseDto>> {
    const { page, pageSize, search, isActive } = query;
    const where = this.buildWhere(search, isActive, user);
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(organizations).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(organizations)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(organizations.name).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as OrganizationRow[]).map(toOrganizationResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(id: string, user?: AuthUser): Promise<OrganizationResponseDto> {
    const row = await this.findActiveRowById(id);
    this.assertCanAccess(row.id, user);
    return toOrganizationResponse(row);
  }

  async create(
    dto: CreateOrganizationDto,
    user?: AuthUser,
  ): Promise<OrganizationResponseDto> {
    if (!user?.isSuperAdmin) {
      throw new ForbiddenException(
        'Only a super-admin can create organizations',
      );
    }

    await this.ensureCurrency(dto.defaultCurrencyId);
    await this.ensureCountry(dto.countryId);

    const id = createId();

    try {
      await this.db.insert(organizations).values({
        id,
        name: dto.name,
        legal_name: dto.legalName ?? null,
        tax_id: dto.taxId ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        website: dto.website ?? null,
        logo_url: dto.logoUrl ?? null,
        default_currency_id: dto.defaultCurrencyId ?? null,
        country_id: dto.countryId ?? null,
        is_active: fromBool(dto.isActive ?? true),
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid currency or country reference for organization',
      );
    }

    return this.findOne(id, user);
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
    user?: AuthUser,
  ): Promise<OrganizationResponseDto> {
    const existing = await this.findActiveRowById(id);
    this.assertCanAccess(existing.id, user);

    if (dto.defaultCurrencyId !== undefined) {
      await this.ensureCurrency(dto.defaultCurrencyId);
    }
    if (dto.countryId !== undefined) {
      await this.ensureCountry(dto.countryId);
    }

    const patch: Partial<{
      name: string;
      legal_name: string | null;
      tax_id: string | null;
      email: string | null;
      phone: string | null;
      website: string | null;
      logo_url: string | null;
      default_currency_id: string | null;
      country_id: string | null;
      is_active: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.legalName !== undefined) patch.legal_name = dto.legalName;
    if (dto.taxId !== undefined) patch.tax_id = dto.taxId;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.website !== undefined) patch.website = dto.website;
    if (dto.logoUrl !== undefined) patch.logo_url = dto.logoUrl;
    if (dto.defaultCurrencyId !== undefined) {
      patch.default_currency_id = dto.defaultCurrencyId;
    }
    if (dto.countryId !== undefined) patch.country_id = dto.countryId;
    if (dto.isActive !== undefined) patch.is_active = fromBool(dto.isActive);

    try {
      await this.db
        .update(organizations)
        .set(patch)
        .where(eq(organizations.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid currency or country reference for organization',
      );
    }

    return this.findOne(id, user);
  }

  async remove(id: string, user?: AuthUser): Promise<void> {
    const existing = await this.findActiveRowById(id);
    this.assertCanAccess(existing.id, user);

    await this.db
      .update(organizations)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(organizations.id, id));
  }

  private assertCanAccess(organizationId: string, user?: AuthUser): void {
    if (!user || user.isSuperAdmin) {
      return;
    }
    if (user.organizationId !== organizationId) {
      throw new ForbiddenException('Cannot access another organization');
    }
  }

  private async findActiveRowById(id: string): Promise<OrganizationRow> {
    const [row] = await this.db
      .select()
      .from(organizations)
      .where(and(eq(organizations.id, id), isNull(organizations.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Organization ${id} not found`);
    }

    return row as OrganizationRow;
  }

  private async ensureCurrency(currencyId?: string | null): Promise<void> {
    if (!currencyId) {
      return;
    }
    const [row] = await this.db
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.id, currencyId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Currency ${currencyId} not found`);
    }
  }

  private async ensureCountry(countryId?: string | null): Promise<void> {
    if (!countryId) {
      return;
    }
    const [row] = await this.db
      .select({ id: countries.id })
      .from(countries)
      .where(eq(countries.id, countryId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Country ${countryId} not found`);
    }
  }

  private buildWhere(
    search?: string,
    isActive?: boolean,
    user?: AuthUser,
  ): SQL | undefined {
    const parts: SQL[] = [isNull(organizations.deleted_at)];

    if (search) {
      parts.push(like(organizations.name, `%${search}%`));
    }
    if (isActive !== undefined) {
      parts.push(eq(organizations.is_active, fromBool(isActive)));
    }
    if (user && !user.isSuperAdmin) {
      parts.push(eq(organizations.id, user.organizationId));
    }

    return and(...parts);
  }
}
