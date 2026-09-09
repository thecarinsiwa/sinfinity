export const NOTIFICATION_CHANNELS = ['in_app', 'email', 'sms'] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_CHANNEL = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
} as const satisfies Record<string, NotificationChannel>;

export type NotifyPayload = {
  organizationId: string;
  userId: string;
  channel?: NotificationChannel;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
};
