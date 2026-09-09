import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { shipping_methods } from '../../../database/schema';
import {
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { ListShippingMethodsQueryDto } from './dto/list-shipping-methods-query.dto';
import {
  CreateShippingMethodDto,
  ShippingMethodResponseDto,
  UpdateShippingMethodDto,
} from './dto/shipping-method.dto';
import { ShippingMethodsSeedService } from './shipping-methods-seed.service';
import {
  toShippingMethodResponse,
  type ShippingMethodRow,
} from './shipping-methods.mapper';

@Injectable()
export class ShippingMethodsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly seedService: ShippingMethodsSeedService,
  ) {}

  async findAll(
    query: ListShippingMethodsQueryDto,
  ): Promise<PaginatedResponseDto<ShippingMethodResponseDto>> {
    await this.seedService.seed();

    const { page, pageSize, code, search } = query;
    const where = this.buildWhere(code, search);
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(shipping_methods).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(shipping_methods)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(shipping_methods.code).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ShippingMethodRow[]).map(toShippingMethodResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<ShippingMethodResponseDto> {
    return toShippingMethodResponse(await this.findRowById(id));
  }

  async create(
    dto: CreateShippingMethodDto,
  ): Promise<ShippingMethodResponseDto> {
    const id = createId();
    try {
      await this.db.insert(shipping_methods).values({
        id,
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description ?? null,
      });
    } catch (error) {
      throwDuplicateOrRethrow(error, 'Shipping method code already exists');
    }
    return this.findOne(id);
  }

  async update(
    id: string,
    dto: UpdateShippingMethodDto,
  ): Promise<ShippingMethodResponseDto> {
    await this.findRowById(id);
    const patch: Partial<{
      code: string;
      name: string;
      description: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.code !== undefined) patch.code = dto.code.toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;

    try {
      await this.db
        .update(shipping_methods)
        .set(patch)
        .where(eq(shipping_methods.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(error, 'Shipping method code already exists');
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findRowById(id);
    try {
      await this.db
        .delete(shipping_methods)
        .where(eq(shipping_methods.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Shipping method is referenced by other records and cannot be deleted',
      );
    }
  }

  private async findRowById(id: string): Promise<ShippingMethodRow> {
    const [row] = await this.db
      .select()
      .from(shipping_methods)
      .where(eq(shipping_methods.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Shipping method ${id} not found`);
    }
    return row as ShippingMethodRow;
  }

  private buildWhere(code?: string, search?: string): SQL | undefined {
    const parts: SQL[] = [];
    if (code) {
      parts.push(eq(shipping_methods.code, code.toUpperCase()));
    }
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      parts.push(
        or(
          like(shipping_methods.name, term),
          like(shipping_methods.code, term),
        )!,
      );
    }
    if (parts.length === 0) return undefined;
    if (parts.length === 1) return parts[0];
    return and(...parts);
  }
}
