import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, like, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { currencies } from '../../../database/schema';
import {
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../utils/mysql-errors';
import { fromBool, nowMysqlDateTime } from '../utils/mysql-datetime';
import { toCurrencyResponse, type CurrencyRow } from './currencies.mapper';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { CurrencyResponseDto } from './dto/currency-response.dto';
import { ListCurrenciesQueryDto } from './dto/list-currencies-query.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';

@Injectable()
export class CurrenciesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListCurrenciesQueryDto,
  ): Promise<PaginatedResponseDto<CurrencyResponseDto>> {
    const { page, pageSize, code, search, isActive } = query;
    const where = this.buildWhere(code, search, isActive);
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(currencies).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(currencies)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(currencies.code).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as CurrencyRow[]).map(toCurrencyResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<CurrencyResponseDto> {
    return toCurrencyResponse(await this.findRowById(id));
  }

  async findIdByCode(code: string): Promise<string> {
    const [row] = await this.db
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.code, code.toUpperCase()))
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        `Currency code ${code.toUpperCase()} not found`,
      );
    }

    return row.id;
  }

  async create(dto: CreateCurrencyDto): Promise<CurrencyResponseDto> {
    const id = createId();

    try {
      await this.db.insert(currencies).values({
        id,
        code: dto.code.toUpperCase(),
        name: dto.name,
        symbol: dto.symbol,
        decimal_places: dto.decimalPlaces ?? 2,
        is_active: fromBool(dto.isActive ?? true),
      });
    } catch (error) {
      throwDuplicateOrRethrow(error, 'Currency code already exists');
    }

    return this.findOne(id);
  }

  async update(
    id: string,
    dto: UpdateCurrencyDto,
  ): Promise<CurrencyResponseDto> {
    await this.findRowById(id);

    const patch: Partial<{
      code: string;
      name: string;
      symbol: string;
      decimal_places: number;
      is_active: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.code !== undefined) patch.code = dto.code.toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.symbol !== undefined) patch.symbol = dto.symbol;
    if (dto.decimalPlaces !== undefined) {
      patch.decimal_places = dto.decimalPlaces;
    }
    if (dto.isActive !== undefined) patch.is_active = fromBool(dto.isActive);

    try {
      await this.db.update(currencies).set(patch).where(eq(currencies.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(error, 'Currency code already exists');
    }

    return this.findOne(id);
  }

  /**
   * Deactivates the currency (is_active = 0). Prefer over hard delete
   * because currencies are heavily referenced.
   */
  async remove(id: string): Promise<void> {
    await this.findRowById(id);

    try {
      await this.db
        .update(currencies)
        .set({ is_active: 0, updated_at: nowMysqlDateTime() })
        .where(eq(currencies.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Currency is referenced by other records and cannot be modified',
      );
    }
  }

  private async findRowById(id: string): Promise<CurrencyRow> {
    const [row] = await this.db
      .select()
      .from(currencies)
      .where(eq(currencies.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Currency ${id} not found`);
    }

    return row;
  }

  private buildWhere(
    code?: string,
    search?: string,
    isActive?: boolean,
  ): SQL | undefined {
    const parts: SQL[] = [];

    if (code) {
      parts.push(eq(currencies.code, code.toUpperCase()));
    }
    if (search) {
      parts.push(like(currencies.name, `%${search}%`));
    }
    if (isActive !== undefined) {
      parts.push(eq(currencies.is_active, fromBool(isActive)));
    }

    if (parts.length === 0) return undefined;
    if (parts.length === 1) return parts[0];
    return and(...parts);
  }
}
