import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, isNull, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { notifications, users } from '../../../database/schema';
import {
  fromBool,
  nowMysqlDateTime,
} from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireScopeOrgId,
} from '../collaboration-scope';
import {
  NOTIFICATION_CHANNEL,
  type NotifyPayload,
} from '../notification-channels';
import {
  ListNotificationsQueryDto,
  NotificationResponseDto,
} from './dto/notification.dto';
import {
  toNotificationResponse,
  type NotificationRow,
} from './notifications.mapper';

/**
 * In-app notifications + channel dispatcher.
 * email/sms are no-op placeholders for future providers.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * Cross-module helper: create a notification for a user.
   * - in_app → persist row
   * - email / sms → no-op (logged), returns null
   */
  async notify(payload: NotifyPayload): Promise<NotificationResponseDto | null> {
    const channel = payload.channel ?? NOTIFICATION_CHANNEL.IN_APP;
    const title = payload.title.trim();
    if (!title) {
      throw new BadRequestException('title is required');
    }

    await ensureOrganizationExists(this.db, payload.organizationId);
    await this.ensureUserInOrg(payload.userId, payload.organizationId);

    if (channel === NOTIFICATION_CHANNEL.IN_APP) {
      return this.createInApp(payload, title);
    }

    this.logger.debug(
      `notify no-op channel=${channel} user=${payload.userId} title=${title}`,
    );
    return null;
  }

  async findAll(
    query: ListNotificationsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<NotificationResponseDto>> {
    if (!user?.id) {
      throw new BadRequestException(
        'Authenticated user is required to list notifications',
      );
    }
    const scopeOrgId = requireScopeOrgId(
      query.organizationId,
      currentOrganizationId,
      user,
    );
    const unreadOnly = query.unreadOnly !== false;
    const parts: SQL[] = [
      eq(notifications.organization_id, scopeOrgId),
      eq(notifications.user_id, user.id),
    ];
    if (unreadOnly) {
      parts.push(eq(notifications.is_read, 0));
    }
    if (query.channel) {
      parts.push(eq(notifications.channel, query.channel));
    }
    if (query.entityType) {
      parts.push(eq(notifications.entity_type, query.entityType));
    }
    if (query.entityId) {
      parts.push(eq(notifications.entity_id, query.entityId));
    }
    const where = and(...parts)!;
    const offset = (query.page - 1) * query.pageSize;

    const listQuery = this.db.select().from(notifications).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(notifications)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(notifications.sent_at), asc(notifications.id))
        .limit(query.pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as NotificationRow[]).map(toNotificationResponse),
      Number(totalRow?.total ?? 0),
      query.page,
      query.pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<NotificationResponseDto> {
    const row = await this.requireNotificationAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toNotificationResponse(row);
  }

  async markRead(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<NotificationResponseDto> {
    const existing = await this.requireNotificationAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.is_read === 1) {
      return toNotificationResponse(existing);
    }

    const now = nowMysqlDateTime();
    await this.db
      .update(notifications)
      .set({
        is_read: fromBool(true),
        read_at: now,
      })
      .where(eq(notifications.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  async markAllRead(
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<{ updated: number }> {
    if (!user?.id) {
      throw new BadRequestException(
        'Authenticated user is required to mark notifications read',
      );
    }
    const scopeOrgId = requireScopeOrgId(
      undefined,
      currentOrganizationId,
      user,
    );
    const now = nowMysqlDateTime();
    const unread = await this.db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.organization_id, scopeOrgId),
          eq(notifications.user_id, user.id),
          eq(notifications.is_read, 0),
        ),
      );

    if (unread.length === 0) {
      return { updated: 0 };
    }

    await this.db
      .update(notifications)
      .set({
        is_read: fromBool(true),
        read_at: now,
      })
      .where(
        and(
          eq(notifications.organization_id, scopeOrgId),
          eq(notifications.user_id, user.id),
          eq(notifications.is_read, 0),
        ),
      );

    return { updated: unread.length };
  }

  private async createInApp(
    payload: NotifyPayload,
    title: string,
  ): Promise<NotificationResponseDto> {
    const id = createId();
    const now = nowMysqlDateTime();
    await this.db.insert(notifications).values({
      id,
      organization_id: payload.organizationId,
      user_id: payload.userId,
      channel: NOTIFICATION_CHANNEL.IN_APP,
      title,
      body: payload.body ?? null,
      entity_type: payload.entityType ?? null,
      entity_id: payload.entityId ?? null,
      is_read: fromBool(false),
      sent_at: now,
      read_at: null,
    });

    const [row] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);
    return toNotificationResponse(row as NotificationRow);
  }

  private async requireNotificationAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<NotificationRow> {
    const [row] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'notification',
    );
    if (user && !user.isSuperAdmin && user.id !== row.user_id) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return row as NotificationRow;
  }

  private async ensureUserInOrg(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: users.id, organization_id: users.organization_id })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Notification user must belong to the same organization',
      );
    }
  }
}
