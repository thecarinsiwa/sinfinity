import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, isNull, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { countries, taxes } from '../../../database/schema';
import { fromBool, nowMysqlDateTime } from '../utils/mysql-datetime';
import { toTaxResponse, type TaxRow } from './taxes.mapper';
import { CreateTaxDto } from './dto/create-tax.dto';
import { ListTaxesQueryDto } from './dto/list-taxes-query.dto';
import { TaxResponseDto } from './dto/tax-response.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

@Injectable()
export class TaxesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListTaxesQueryDto,
    currentOrganizationId?: string,
  ): Promise<PaginatedResponseDto<TaxResponseDto>> {
    const { page, pageSize, search, taxType, countryId, globalOnly, isActive } =
      query;
    const where = this.buildWhere({
      search,
      taxType,
      countryId,
      globalOnly,
      isActive,
      currentOrganizationId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(taxes).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(taxes)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(taxes.code).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as TaxRow[]).map(toTaxResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<TaxResponseDto> {
    return toTaxResponse(await this.findActiveRowById(id));
  }

  async create(
    dto: CreateTaxDto,
    currentOrganizationId?: string,
  ): Promise<TaxResponseDto> {
    if (dto.countryId) {
      await this.ensureCountryExists(dto.countryId);
    }

    const organizationId =
      dto.organizationId === undefined
        ? (currentOrganizationId ?? null)
        : dto.organizationId;

    const id = createId();

    await this.db.insert(taxes).values({
      id,
      organization_id: organizationId,
      code: dto.code,
      name: dto.name,
      rate: dto.rate,
      tax_type: dto.taxType,
      country_id: dto.countryId ?? null,
      is_active: fromBool(dto.isActive ?? true),
    });

    return this.findOne(id);
  }

  async update(id: string, dto: UpdateTaxDto): Promise<TaxResponseDto> {
    await this.findActiveRowById(id);

    if (dto.countryId) {
      await this.ensureCountryExists(dto.countryId);
    }

    const patch: Partial<{
      organization_id: string | null;
      code: string;
      name: string;
      rate: string;
      tax_type: CreateTaxDto['taxType'];
      country_id: string | null;
      is_active: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.organizationId !== undefined) {
      patch.organization_id = dto.organizationId;
    }
    if (dto.code !== undefined) patch.code = dto.code;
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.rate !== undefined) patch.rate = dto.rate;
    if (dto.taxType !== undefined) patch.tax_type = dto.taxType;
    if (dto.countryId !== undefined) patch.country_id = dto.countryId;
    if (dto.isActive !== undefined) patch.is_active = fromBool(dto.isActive);

    await this.db.update(taxes).set(patch).where(eq(taxes.id, id));
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findActiveRowById(id);
    await this.db
      .update(taxes)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(taxes.id, id));
  }

  private async findActiveRowById(id: string): Promise<TaxRow> {
    const [row] = await this.db
      .select()
      .from(taxes)
      .where(and(eq(taxes.id, id), isNull(taxes.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Tax ${id} not found`);
    }

    return row;
  }

  private async ensureCountryExists(countryId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: countries.id })
      .from(countries)
      .where(eq(countries.id, countryId))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Country ${countryId} not found`);
    }
  }

  private buildWhere(params: {
    search?: string;
    taxType?: string;
    countryId?: string;
    globalOnly?: boolean;
    isActive?: boolean;
    currentOrganizationId?: string;
  }): SQL | undefined {
    const parts: SQL[] = [isNull(taxes.deleted_at)];

    if (params.search) {
      parts.push(
        or(
          like(taxes.code, `%${params.search}%`),
          like(taxes.name, `%${params.search}%`),
        )!,
      );
    }
    if (params.taxType) {
      parts.push(eq(taxes.tax_type, params.taxType as TaxRow['tax_type']));
    }
    if (params.countryId) {
      parts.push(eq(taxes.country_id, params.countryId));
    }
    if (params.isActive !== undefined) {
      parts.push(eq(taxes.is_active, fromBool(params.isActive)));
    }

    if (params.globalOnly) {
      parts.push(isNull(taxes.organization_id));
    } else if (params.currentOrganizationId) {
      parts.push(
        or(
          isNull(taxes.organization_id),
          eq(taxes.organization_id, params.currentOrganizationId),
        )!,
      );
    }

    return and(...parts);
  }
}
