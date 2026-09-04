export { CommonModule } from './common.module';
export {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SORT_ORDER,
  type SortOrder,
} from './constants';
export { ApiPaginatedResponse } from './decorators/api-paginated-response.decorator';
export { CurrentUser } from './decorators/current-user.decorator';
export { OrganizationId } from './decorators/organization-id.decorator';
export { PERMISSIONS_KEY } from './decorators/permissions.constants';
export { RequirePermissions } from './decorators/require-permissions.decorator';
export { ErrorResponseDto } from './dto/error-response.dto';
export {
  buildPaginatedResponse,
  PaginatedResponseDto,
  PaginationMetaDto,
} from './dto/paginated-response.dto';
export { PaginationQueryDto } from './dto/pagination-query.dto';
export { Public, IS_PUBLIC_KEY } from './decorators/public.decorator';
export { SkipAudit, SKIP_AUDIT_KEY } from './decorators/skip-audit.decorator';
export { HttpExceptionFilter } from './filters/http-exception.filter';
export { PermissionsGuard } from './guards/permissions.guard';
export { LoggingInterceptor } from './interceptors/logging.interceptor';
export {
  ParseUUIDPipe,
  type ParseUUIDPipeOptions,
} from './pipes/parse-uuid.pipe';
export type { AuthenticatedRequest, AuthUser } from './types/auth-user.type';
export { createId } from './utils/create-id';
export { parseTtlToMs, parseTtlToSeconds } from './utils/parse-ttl';

/** Re-export real guard from Auth module for stable import path. */
export { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
