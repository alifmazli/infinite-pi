import { ApiError, ApiMeta, ApiResponse } from '../types/api.types';

/**
 * Standardized response helper function
 */
export function createResponse<T>(
  data: T,
  meta?: Partial<ApiMeta>,
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function createErrorResponse(
  error: ApiError,
  meta?: Partial<ApiMeta>,
): ApiResponse<never> {
  return {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

