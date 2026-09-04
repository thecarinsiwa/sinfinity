export type AccessTokenPayload = {
  sub: string;
  organizationId: string;
  email: string;
  sessionId: string;
  isSuperAdmin?: boolean;
};

export const PASSWORD_RESET_PURPOSE = 'password_reset' as const;

export type PasswordResetTokenPayload = {
  sub: string;
  organizationId: string;
  email: string;
  purpose: typeof PASSWORD_RESET_PURPOSE;
};
