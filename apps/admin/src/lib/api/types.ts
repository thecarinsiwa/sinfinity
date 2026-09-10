/** Aligné sur PaginationMetaDto de l’API Nest. */
export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** Aligné sur PaginatedResponseDto de l’API Nest. */
export type PaginatedResponse<TData> = {
  data: TData[];
  meta: PaginationMeta;
};

/** Aligné sur ErrorResponseDto de l’API Nest. */
export type ApiErrorBody = {
  statusCode: number;
  message: string | string[];
  error: string;
};
