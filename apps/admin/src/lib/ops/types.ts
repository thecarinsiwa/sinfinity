/** Aligné API SystemSettingResponseDto / Upsert DTOs. */

export const SYSTEM_SETTING_KEY_REGEX = /^[a-zA-Z][a-zA-Z0-9._-]*$/;

export type SystemSetting = {
  id: string;
  organizationId: string;
  key: string;
  /** JSON libre (objet, tableau ou primitif). */
  value: unknown;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertSystemSettingInput = {
  value: unknown;
  description?: string | null;
};

export type UpsertSystemSettingItemInput = UpsertSystemSettingInput & {
  key: string;
};

export type BulkUpsertSystemSettingsInput = {
  settings: UpsertSystemSettingItemInput[];
};

/** Aligné API AuditLogResponseDto. */
export type AuditLog = {
  id: string;
  organizationId: string | null;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | unknown[] | null;
  newValues: Record<string, unknown> | unknown[] | null;
  ipAddress: string | null;
  createdAt: string;
};

/** Aligné API LoginLogResponseDto. */
export type LoginLog = {
  id: string;
  userId: string | null;
  emailAttempted: string | null;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};
