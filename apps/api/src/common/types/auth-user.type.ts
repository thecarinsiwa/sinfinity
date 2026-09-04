/**
 * Stable auth context shape for phase 1+.
 * Populated by JwtAuthGuard once auth exists; decorators stay unchanged.
 */
export type AuthUser = {
  id: string;
  organizationId: string;
  email?: string;
  permissions?: string[];
  /** Platform operator — required for creating organizations. */
  isSuperAdmin?: boolean;
  sessionId?: string;
};

export type AuthenticatedRequest = {
  user?: AuthUser;
};
