import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, isNull, like, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { organizations, system_settings } from '../../../database/schema';
import { throwDuplicateOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { ListSystemSettingsQueryDto } from './dto/list-system-settings-query.dto';
import { SystemSettingResponseDto } from './dto/system-setting-response.dto';
import {
  UpsertSystemSettingDto,
  UpsertSystemSettingItemDto,
} from './dto/upsert-system-setting.dto';
import {
  toSystemSettingResponse,
  type SystemSettingRow,
} from './system-settings.mapper';

@Injectable()
export class SystemSettingsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListSystemSettingsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<SystemSettingResponseDto>> {
    const { page, pageSize, search, organizationId } = query;
    const scopeOrgId = this.requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({ organizationId: scopeOrgId, search });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(system_settings).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(system_settings)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(system_settings.key).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as SystemSettingRow[]).map(toSystemSettingResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findByKey(
    key: string,
    currentOrganizationId?: string,
    user?: AuthUser,
    queryOrganizationId?: string,
  ): Promise<SystemSettingResponseDto> {
    const organizationId = this.requireScopeOrgId(
      queryOrganizationId,
      currentOrganizationId,
      user,
    );
    const row = await this.findRowByOrgKey(organizationId, key);
    if (!row) {
      throw new NotFoundException(
        `System setting "${key}" not found for organization`,
      );
    }
    return toSystemSettingResponse(row);
  }

  async upsertByKey(
    key: string,
    dto: UpsertSystemSettingDto,
    currentOrganizationId?: string,
    user?: AuthUser,
    queryOrganizationId?: string,
  ): Promise<SystemSettingResponseDto> {
    const organizationId = this.requireScopeOrgId(
      queryOrganizationId,
      currentOrganizationId,
      user,
    );
    await this.ensureOrganizationExists(organizationId);
    return this.upsertOne(organizationId, {
      key,
      value: dto.value,
      description: dto.description,
    });
  }

  async bulkUpsert(
    items: UpsertSystemSettingItemDto[],
    currentOrganizationId?: string,
    user?: AuthUser,
    queryOrganizationId?: string,
  ): Promise<SystemSettingResponseDto[]> {
    const organizationId = this.requireScopeOrgId(
      queryOrganizationId,
      currentOrganizationId,
      user,
    );
    await this.ensureOrganizationExists(organizationId);

    const results: SystemSettingResponseDto[] = [];
    for (const item of items) {
      results.push(await this.upsertOne(organizationId, item));
    }
    return results;
  }

  private async upsertOne(
    organizationId: string,
    item: {
      key: string;
      value: unknown;
      description?: string | null;
    },
  ): Promise<SystemSettingResponseDto> {
    const key = item.key.trim();
    const existing = await this.findRowByOrgKey(organizationId, key);

    if (existing) {
      try {
        await this.db
          .update(system_settings)
          .set({
            value: item.value as never,
            description:
              item.description !== undefined
                ? item.description
                : existing.description,
            updated_at: nowMysqlDateTime(),
          })
          .where(eq(system_settings.id, existing.id));
      } catch (error) {
        throwDuplicateOrRethrow(
          error,
          'System setting key already exists for this organization',
        );
      }
      return this.findById(existing.id);
    }

    const id = createId();
    try {
      await this.db.insert(system_settings).values({
        id,
        organization_id: organizationId,
        key,
        value: item.value as never,
        description: item.description ?? null,
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'System setting key already exists for this organization',
      );
    }

    return this.findById(id);
  }

  private async findById(id: string): Promise<SystemSettingResponseDto> {
    const [row] = await this.db
      .select()
      .from(system_settings)
      .where(eq(system_settings.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`System setting ${id} not found`);
    }

    return toSystemSettingResponse(row as SystemSettingRow);
  }

  private async findRowByOrgKey(
    organizationId: string,
    key: string,
  ): Promise<SystemSettingRow | null> {
    const [row] = await this.db
      .select()
      .from(system_settings)
      .where(
        and(
          eq(system_settings.organization_id, organizationId),
          eq(system_settings.key, key),
        ),
      )
      .limit(1);

    return (row as SystemSettingRow | undefined) ?? null;
  }

  private requireScopeOrgId(
    queryOrgId: string | undefined,
    currentOrganizationId: string | undefined,
    user?: AuthUser,
  ): string {
    if (user?.isSuperAdmin) {
      const organizationId =
        queryOrgId ?? currentOrganizationId ?? user.organizationId;
      if (!organizationId) {
        throw new BadRequestException('organizationId is required');
      }
      return organizationId;
    }

    const organizationId =
      currentOrganizationId ?? user?.organizationId ?? queryOrgId;
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    if (queryOrgId && queryOrgId !== organizationId) {
      throw new ForbiddenException(
        'Cannot access system settings of another organization',
      );
    }
    return organizationId;
  }

  private async ensureOrganizationExists(organizationId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        and(eq(organizations.id, organizationId), isNull(organizations.deleted_at)),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(system_settings.organization_id, params.organizationId),
    ];
    if (params.search) {
      parts.push(like(system_settings.key, `%${params.search}%`));
    }
    return and(...parts)!;
  }
}
