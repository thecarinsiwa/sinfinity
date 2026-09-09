import { toBool } from '../../settings/utils/mysql-datetime';
import type { NotificationChannel } from '../notification-channels';
import type { NotificationResponseDto } from './dto/notification.dto';

export type NotificationRow = {
  id: string;
  organization_id: string;
  user_id: string;
  channel: NotificationChannel;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: number;
  sent_at: string;
  read_at: string | null;
};

export function toNotificationResponse(
  row: NotificationRow,
): NotificationResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    channel: row.channel,
    title: row.title,
    body: row.body,
    entityType: row.entity_type,
    entityId: row.entity_id,
    isRead: toBool(row.is_read),
    sentAt: row.sent_at,
    readAt: row.read_at,
  };
}
