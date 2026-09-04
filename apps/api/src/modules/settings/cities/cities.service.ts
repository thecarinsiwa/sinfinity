import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, isNull, like, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { cities, countries } from '../../../database/schema';
import { throwDuplicateOrRethrow } from '../utils/mysql-errors';
import { normalizeBlankToNull } from '../utils/normalize-blank';
import { toCityResponse, type CityRow } from './cities.mapper';
import { CreateCityDto } from './dto/create-city.dto';
import { CityResponseDto } from './dto/city-response.dto';
import { ListCitiesQueryDto } from './dto/list-cities-query.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Injectable()
export class CitiesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListCitiesQueryDto,
  ): Promise<PaginatedResponseDto<CityResponseDto>> {
    const { page, pageSize, countryId, countryCode, search } = query;
    const offset = (page - 1) * pageSize;
    const filters = this.buildFilters(countryId, search);

    if (countryCode) {
      const code = countryCode.toUpperCase();
      const whereParts: SQL[] = [
        eq(countries.code, code),
        ...(filters ? [filters] : []),
      ];
      const where = and(...whereParts);

      const [rows, [totalRow]] = await Promise.all([
        this.db
          .select({
            id: cities.id,
            country_id: cities.country_id,
            name: cities.name,
            region: cities.region,
            created_at: cities.created_at,
            updated_at: cities.updated_at,
          })
          .from(cities)
          .innerJoin(countries, eq(cities.country_id, countries.id))
          .where(where)
          .orderBy(cities.name)
          .limit(pageSize)
          .offset(offset),
        this.db
          .select({ total: count() })
          .from(cities)
          .innerJoin(countries, eq(cities.country_id, countries.id))
          .where(where),
      ]);

      return buildPaginatedResponse(
        (rows as CityRow[]).map(toCityResponse),
        Number(totalRow?.total ?? 0),
        page,
        pageSize,
      );
    }

    const listQuery = this.db.select().from(cities).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(cities)
      .$dynamic();

    if (filters) {
      listQuery.where(filters);
      countQuery.where(filters);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(cities.name).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as CityRow[]).map(toCityResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<CityResponseDto> {
    return toCityResponse(await this.findRowById(id));
  }

  async create(dto: CreateCityDto): Promise<CityResponseDto> {
    await this.ensureCountryExists(dto.countryId);
    const region = normalizeBlankToNull(dto.region) ?? null;
    await this.assertUnique(dto.countryId, dto.name, region);

    const id = createId();

    try {
      await this.db.insert(cities).values({
        id,
        country_id: dto.countryId,
        name: dto.name,
        region,
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'City with the same country, name and region already exists',
      );
    }

    return this.findOne(id);
  }

  async update(id: string, dto: UpdateCityDto): Promise<CityResponseDto> {
    const existing = await this.findRowById(id);
    const countryId = dto.countryId ?? existing.country_id;
    const name = dto.name ?? existing.name;
    const region =
      dto.region !== undefined
        ? (normalizeBlankToNull(dto.region) ?? null)
        : existing.region;

    if (dto.countryId) {
      await this.ensureCountryExists(dto.countryId);
    }

    await this.assertUnique(countryId, name, region, id);

    const patch: Partial<{
      country_id: string;
      name: string;
      region: string | null;
      updated_at: string;
    }> = {
      updated_at: new Date().toISOString().replace('T', ' ').replace('Z', ''),
    };

    if (dto.countryId !== undefined) {
      patch.country_id = dto.countryId;
    }
    if (dto.name !== undefined) {
      patch.name = dto.name;
    }
    if (dto.region !== undefined) {
      patch.region = region;
    }

    try {
      await this.db.update(cities).set(patch).where(eq(cities.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'City with the same country, name and region already exists',
      );
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findRowById(id);
    await this.db.delete(cities).where(eq(cities.id, id));
  }

  private async findRowById(id: string): Promise<CityRow> {
    const [row] = await this.db
      .select()
      .from(cities)
      .where(eq(cities.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`City ${id} not found`);
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

  private async assertUnique(
    countryId: string,
    name: string,
    region: string | null,
    excludeId?: string,
  ): Promise<void> {
    const parts: SQL[] = [
      eq(cities.country_id, countryId),
      eq(cities.name, name),
      region === null ? isNull(cities.region) : eq(cities.region, region),
    ];

    const [dup] = await this.db
      .select({ id: cities.id })
      .from(cities)
      .where(and(...parts))
      .limit(1);

    if (dup && dup.id !== excludeId) {
      throw new ConflictException(
        'City with the same country, name and region already exists',
      );
    }
  }

  private buildFilters(countryId?: string, search?: string): SQL | undefined {
    const parts: SQL[] = [];

    if (countryId) {
      parts.push(eq(cities.country_id, countryId));
    }
    if (search) {
      parts.push(like(cities.name, `%${search}%`));
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
