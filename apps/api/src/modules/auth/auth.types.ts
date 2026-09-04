export type AccessTokenPayload = {
  sub: string;
  organizationId: string;
  email: string;
  sessionId: string;
  isSuperAdmin?: boolean;
};
