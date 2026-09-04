import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, like, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { countries } from '../../../database/schema';
import {
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../utils/mysql-errors';
import { toCountryResponse, type CountryRow } from './countries.mapper';
import { CreateCountryDto } from './dto/create-country.dto';
import { CountryResponseDto } from './dto/country-response.dto';
import { ListCountriesQueryDto } from './dto/list-countries-query.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Injectable()
export class CountriesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListCountriesQueryDto,
  ): Promise<PaginatedResponseDto<CountryResponseDto>> {
    const { page, pageSize, code, search } = query;
    const where = this.buildWhere(code, search);
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(countries).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(countries)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(countries.name).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as CountryRow[]).map(toCountryResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<CountryResponseDto> {
    const row = await this.findRowById(id);
    return toCountryResponse(row);
  }

  async create(dto: CreateCountryDto): Promise<CountryResponseDto> {
    const id = createId();
    const code = dto.code.toUpperCase();
    const code3 = dto.code3?.toUpperCase() ?? null;

    try {
      await this.db.insert(countries).values({
        id,
        code,
        code3,
        name: dto.name,
        phone_code: dto.phoneCode ?? null,
      });
    } catch (error) {
      throwDuplicateOrRethrow(error, 'Country code already exists');
    }

    return this.findOne(id);
  }

  async update(id: string, dto: UpdateCountryDto): Promise<CountryResponseDto> {
    await this.findRowById(id);

    const patch: Partial<{
      code: string;
      code3: string | null;
      name: string;
      phone_code: string | null;
      updated_at: string;
    }> = {
      updated_at: new Date().toISOString().replace('T', ' ').replace('Z', ''),
    };

    if (dto.code !== undefined) {
      patch.code = dto.code.toUpperCase();
    }
    if (dto.code3 !== undefined) {
      patch.code3 = dto.code3 === null ? null : dto.code3.toUpperCase();
    }
    if (dto.name !== undefined) {
      patch.name = dto.name;
    }
    if (dto.phoneCode !== undefined) {
      patch.phone_code = dto.phoneCode;
    }

    try {
      await this.db.update(countries).set(patch).where(eq(countries.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(error, 'Country code already exists');
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findRowById(id);

    try {
      await this.db.delete(countries).where(eq(countries.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Country is referenced by other records and cannot be deleted',
      );
    }
  }

  private async findRowById(id: string): Promise<CountryRow> {
    const [row] = await this.db
      .select()
      .from(countries)
      .where(eq(countries.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Country ${id} not found`);
    }

    return row;
  }

  private buildWhere(code?: string, search?: string): SQL | undefined {
    const parts: SQL[] = [];

    if (code) {
      parts.push(eq(countries.code, code.toUpperCase()));
    }
    if (search) {
      parts.push(like(countries.name, `%${search}%`));
    }

    if (parts.length === 0) {
      return undefined;
    }
    if (parts.length === 1) {
      return parts[0];
    }
    return and(...parts);
  }
}
