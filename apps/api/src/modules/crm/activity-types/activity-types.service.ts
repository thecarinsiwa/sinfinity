import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { activity_types } from '../../../database/schema';
import { ActivityTypeResponseDto } from './dto/activity-type-response.dto';
import { ListActivityTypesQueryDto } from './dto/list-activity-types-query.dto';
import {
  toActivityTypeResponse,
  type ActivityTypeRow,
} from './activity-types.mapper';

@Injectable()
export class ActivityTypesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListActivityTypesQueryDto,
  ): Promise<PaginatedResponseDto<ActivityTypeResponseDto>> {
    const { page, pageSize, search } = query;
    const where = this.buildWhere(search);
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(activity_types).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(activity_types)
      .$dynamic();
    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(activity_types.code))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ActivityTypeRow[]).map(toActivityTypeResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<ActivityTypeResponseDto> {
    const [row] = await this.db
      .select()
      .from(activity_types)
      .where(eq(activity_types.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Activity type ${id} not found`);
    }
    return toActivityTypeResponse(row as ActivityTypeRow);
  }

  private buildWhere(search?: string): SQL | undefined {
    if (!search) return undefined;
    return or(
      like(activity_types.code, `%${search}%`),
      like(activity_types.name, `%${search}%`),
    )!;
  }
}
