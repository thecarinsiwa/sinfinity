import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, like, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { units } from '../../../database/schema';
import {
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../utils/mysql-errors';
import { nowMysqlDateTime } from '../utils/mysql-datetime';
import { toUnitResponse, type UnitRow } from './units.mapper';
import { CreateUnitDto } from './dto/create-unit.dto';
import { ListUnitsQueryDto } from './dto/list-units-query.dto';
import { UnitResponseDto } from './dto/unit-response.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListUnitsQueryDto,
  ): Promise<PaginatedResponseDto<UnitResponseDto>> {
    const { page, pageSize, code, search, unitType } = query;
    const where = this.buildWhere(code, search, unitType);
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(units).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(units)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(units.code).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as UnitRow[]).map(toUnitResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<UnitResponseDto> {
    return toUnitResponse(await this.findRowById(id));
  }

  async create(dto: CreateUnitDto): Promise<UnitResponseDto> {
    const id = createId();

    try {
      await this.db.insert(units).values({
        id,
        code: dto.code.toUpperCase(),
        name: dto.name,
        symbol: dto.symbol ?? null,
        unit_type: dto.unitType ?? 'count',
      });
    } catch (error) {
      throwDuplicateOrRethrow(error, 'Unit code already exists');
    }

    return this.findOne(id);
  }

  async update(id: string, dto: UpdateUnitDto): Promise<UnitResponseDto> {
    await this.findRowById(id);

    const patch: Partial<{
      code: string;
      name: string;
      symbol: string | null;
      unit_type: CreateUnitDto['unitType'];
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.code !== undefined) patch.code = dto.code.toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.symbol !== undefined) patch.symbol = dto.symbol;
    if (dto.unitType !== undefined) patch.unit_type = dto.unitType;

    try {
      await this.db.update(units).set(patch).where(eq(units.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(error, 'Unit code already exists');
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findRowById(id);

    try {
      await this.db.delete(units).where(eq(units.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Unit is referenced by other records and cannot be deleted',
      );
    }
  }

  private async findRowById(id: string): Promise<UnitRow> {
    const [row] = await this.db
      .select()
      .from(units)
      .where(eq(units.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Unit ${id} not found`);
    }

    return row;
  }

  private buildWhere(
    code?: string,
    search?: string,
    unitType?: string,
  ): SQL | undefined {
    const parts: SQL[] = [];

    if (code) {
      parts.push(eq(units.code, code.toUpperCase()));
    }
    if (search) {
      parts.push(like(units.name, `%${search}%`));
    }
    if (unitType) {
      parts.push(eq(units.unit_type, unitType as UnitRow['unit_type']));
    }

    if (parts.length === 0) return undefined;
    if (parts.length === 1) return parts[0];
    return and(...parts);
  }
}
