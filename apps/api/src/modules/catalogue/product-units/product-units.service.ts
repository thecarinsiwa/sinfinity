import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, count, eq, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { product_units } from '../../../database/schema';
import { ListProductUnitsQueryDto } from './dto/list-product-units-query.dto';
import { ProductUnitResponseDto } from './dto/product-unit-response.dto';
import {
  toProductUnitResponse,
  type ProductUnitRow,
} from './product-units.mapper';

@Injectable()
export class ProductUnitsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListProductUnitsQueryDto,
  ): Promise<PaginatedResponseDto<ProductUnitResponseDto>> {
    const { page, pageSize, search } = query;
    const offset = (page - 1) * pageSize;
    const where = this.buildWhere(search);

    const listQuery = this.db.select().from(product_units).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(product_units)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(product_units.code))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ProductUnitRow[]).map(toProductUnitResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<ProductUnitResponseDto> {
    const [row] = await this.db
      .select()
      .from(product_units)
      .where(eq(product_units.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Product unit ${id} not found`);
    }
    return toProductUnitResponse(row as ProductUnitRow);
  }

  private buildWhere(search?: string): SQL | undefined {
    if (!search) {
      return undefined;
    }
    return or(
      like(product_units.code, `%${search}%`),
      like(product_units.name, `%${search}%`),
    )!;
  }
}
