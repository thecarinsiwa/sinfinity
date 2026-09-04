import { SetMetadata } from '@nestjs/common';

export const SKIP_AUDIT_KEY = 'skipAudit';

/** Opt out of AuditInterceptor for a handler or controller. */
export const SkipAudit = () => SetMetadata(SKIP_AUDIT_KEY, true);
