import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, like, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { shipping_terms } from '../../../database/schema';
import {
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../utils/mysql-errors';
import { nowMysqlDateTime } from '../utils/mysql-datetime';
import {
  toShippingTermResponse,
  type ShippingTermRow,
} from './shipping-terms.mapper';
import { CreateShippingTermDto } from './dto/create-shipping-term.dto';
import { ListShippingTermsQueryDto } from './dto/list-shipping-terms-query.dto';
import { ShippingTermResponseDto } from './dto/shipping-term-response.dto';
import { UpdateShippingTermDto } from './dto/update-shipping-term.dto';

@Injectable()
export class ShippingTermsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListShippingTermsQueryDto,
  ): Promise<PaginatedResponseDto<ShippingTermResponseDto>> {
    const { page, pageSize, code, search, incotermVersion } = query;
    const where = this.buildWhere(code, search, incotermVersion);
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(shipping_terms).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(shipping_terms)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(shipping_terms.code).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ShippingTermRow[]).map(toShippingTermResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<ShippingTermResponseDto> {
    return toShippingTermResponse(await this.findRowById(id));
  }

  async create(dto: CreateShippingTermDto): Promise<ShippingTermResponseDto> {
    const id = createId();

    try {
      await this.db.insert(shipping_terms).values({
        id,
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description ?? null,
        incoterm_version: dto.incotermVersion ?? '2020',
      });
    } catch (error) {
      throwDuplicateOrRethrow(error, 'Shipping term code already exists');
    }

    return this.findOne(id);
  }

  async update(
    id: string,
    dto: UpdateShippingTermDto,
  ): Promise<ShippingTermResponseDto> {
    await this.findRowById(id);

    const patch: Partial<{
      code: string;
      name: string;
      description: string | null;
      incoterm_version: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.code !== undefined) patch.code = dto.code.toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.incotermVersion !== undefined) {
      patch.incoterm_version = dto.incotermVersion;
    }

    try {
      await this.db
        .update(shipping_terms)
        .set(patch)
        .where(eq(shipping_terms.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(error, 'Shipping term code already exists');
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findRowById(id);

    try {
      await this.db.delete(shipping_terms).where(eq(shipping_terms.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Shipping term is referenced by other records and cannot be deleted',
      );
    }
  }

  private async findRowById(id: string): Promise<ShippingTermRow> {
    const [row] = await this.db
      .select()
      .from(shipping_terms)
      .where(eq(shipping_terms.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Shipping term ${id} not found`);
    }

    return row;
  }

  private buildWhere(
    code?: string,
    search?: string,
    incotermVersion?: string,
  ): SQL | undefined {
    const parts: SQL[] = [];

    if (code) {
      parts.push(eq(shipping_terms.code, code.toUpperCase()));
    }
    if (search) {
      parts.push(like(shipping_terms.name, `%${search}%`));
    }
    if (incotermVersion) {
      parts.push(eq(shipping_terms.incoterm_version, incotermVersion));
    }

    if (parts.length === 0) return undefined;
    if (parts.length === 1) return parts[0];
    return and(...parts);
  }
}
