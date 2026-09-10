export { getAccessToken, setAccessTokenGetter } from "./auth-token";
export type { AccessTokenGetter } from "./auth-token";
export {
  apiFetch,
  buildBackendProxyUrl,
  buildNestUrl,
  getApiBaseUrl,
} from "./client";
export type { ApiFetchOptions } from "./client";
export { ApiError, parseApiErrorBody } from "./errors";
export type {
  ApiErrorBody,
  PaginatedResponse,
  PaginationMeta,
} from "./types";
export type { HealthResponse } from "./health";
// apiFetchServer: import from `@/lib/api/server-fetch` (server-only).
