import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { currencies, exchange_rates } from '../../../database/schema';
import { CurrenciesService } from '../currencies/currencies.service';
import { throwDuplicateOrRethrow } from '../utils/mysql-errors';
import { todayMysqlDate } from '../utils/mysql-datetime';
import {
  toExchangeRateResponse,
  type ExchangeRateRow,
} from './exchange-rates.mapper';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { ExchangeRateResponseDto } from './dto/exchange-rate-response.dto';
import {
  LatestExchangeRateQueryDto,
  ListExchangeRatesQueryDto,
} from './dto/list-exchange-rates-query.dto';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';

@Injectable()
export class ExchangeRatesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly currenciesService: CurrenciesService,
  ) {}

  async findAll(
    query: ListExchangeRatesQueryDto,
  ): Promise<PaginatedResponseDto<ExchangeRateResponseDto>> {
    const {
      page,
      pageSize,
      fromCurrencyId,
      toCurrencyId,
      rateDateFrom,
      rateDateTo,
    } = query;
    const where = this.buildWhere(
      fromCurrencyId,
      toCurrencyId,
      rateDateFrom,
      rateDateTo,
    );
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(exchange_rates).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(exchange_rates)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(exchange_rates.rate_date))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ExchangeRateRow[]).map(toExchangeRateResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<ExchangeRateResponseDto> {
    return toExchangeRateResponse(await this.findRowById(id));
  }

  async findLatest(
    query: LatestExchangeRateQueryDto,
  ): Promise<ExchangeRateResponseDto> {
    const fromId = await this.currenciesService.findIdByCode(query.from);
    const toId = await this.currenciesService.findIdByCode(query.to);
    const asOf = query.date ?? todayMysqlDate();

    const [row] = await this.db
      .select()
      .from(exchange_rates)
      .where(
        and(
          eq(exchange_rates.from_currency_id, fromId),
          eq(exchange_rates.to_currency_id, toId),
          lte(exchange_rates.rate_date, asOf),
        ),
      )
      .orderBy(desc(exchange_rates.rate_date))
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        `No exchange rate found for ${query.from.toUpperCase()}/${query.to.toUpperCase()} on or before ${asOf}`,
      );
    }

    return toExchangeRateResponse(row);
  }

  async create(dto: CreateExchangeRateDto): Promise<ExchangeRateResponseDto> {
    await this.ensureCurrencyExists(dto.fromCurrencyId);
    await this.ensureCurrencyExists(dto.toCurrencyId);

    const id = createId();
    const rateDate = dto.rateDate.slice(0, 10);

    try {
      await this.db.insert(exchange_rates).values({
        id,
        from_currency_id: dto.fromCurrencyId,
        to_currency_id: dto.toCurrencyId,
        rate: dto.rate,
        rate_date: rateDate,
        source: dto.source ?? null,
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Exchange rate for this pair and date already exists',
      );
    }

    return this.findOne(id);
  }

  async update(
    id: string,
    dto: UpdateExchangeRateDto,
  ): Promise<ExchangeRateResponseDto> {
    await this.findRowById(id);

    if (dto.fromCurrencyId) {
      await this.ensureCurrencyExists(dto.fromCurrencyId);
    }
    if (dto.toCurrencyId) {
      await this.ensureCurrencyExists(dto.toCurrencyId);
    }

    const patch: Partial<{
      from_currency_id: string;
      to_currency_id: string;
      rate: string;
      rate_date: string;
      source: string | null;
    }> = {};

    if (dto.fromCurrencyId !== undefined) {
      patch.from_currency_id = dto.fromCurrencyId;
    }
    if (dto.toCurrencyId !== undefined) {
      patch.to_currency_id = dto.toCurrencyId;
    }
    if (dto.rate !== undefined) patch.rate = dto.rate;
    if (dto.rateDate !== undefined) patch.rate_date = dto.rateDate.slice(0, 10);
    if (dto.source !== undefined) patch.source = dto.source;

    try {
      await this.db
        .update(exchange_rates)
        .set(patch)
        .where(eq(exchange_rates.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Exchange rate for this pair and date already exists',
      );
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findRowById(id);
    await this.db.delete(exchange_rates).where(eq(exchange_rates.id, id));
  }

  private async findRowById(id: string): Promise<ExchangeRateRow> {
    const [row] = await this.db
      .select()
      .from(exchange_rates)
      .where(eq(exchange_rates.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Exchange rate ${id} not found`);
    }

    return row;
  }

  private async ensureCurrencyExists(currencyId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.id, currencyId))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Currency ${currencyId} not found`);
    }
  }

  private buildWhere(
    fromCurrencyId?: string,
    toCurrencyId?: string,
    rateDateFrom?: string,
    rateDateTo?: string,
  ): SQL | undefined {
    const parts: SQL[] = [];

    if (fromCurrencyId) {
      parts.push(eq(exchange_rates.from_currency_id, fromCurrencyId));
    }
    if (toCurrencyId) {
      parts.push(eq(exchange_rates.to_currency_id, toCurrencyId));
    }
    if (rateDateFrom) {
      parts.push(gte(exchange_rates.rate_date, rateDateFrom.slice(0, 10)));
    }
    if (rateDateTo) {
      parts.push(lte(exchange_rates.rate_date, rateDateTo.slice(0, 10)));
    }

    if (parts.length === 0) return undefined;
    if (parts.length === 1) return parts[0];
    return and(...parts);
  }
}
