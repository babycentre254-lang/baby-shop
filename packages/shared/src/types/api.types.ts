/**
 * Standard success envelope for every API response.
 * The ResponseInterceptor in NestJS wraps controller returns in this shape.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Standard error envelope. Every thrown HTTP exception is normalized
 * to this shape by the global HttpExceptionFilter.
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Paginated payload shape. Matches the meta we return from list endpoints.
 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}