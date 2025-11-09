/**
 * Shared API types and interfaces
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  timestamp: string;
  correlationId?: string;
  version?: string;
}

export interface PiValueResponse {
  value: string;
  decimalPlaces: number;
  cached: boolean;
  cachedAt?: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  message: string;
  timestamp: string;
  services?: {
    database?: {
      status: 'healthy' | 'unhealthy';
      message?: string;
    };
    computation?: {
      status: 'healthy' | 'unhealthy';
      message?: string;
    };
  };
}

export interface LatestPiValue {
  value: string;
  precision: number;
  fromCache: boolean;
  fromBuffer: boolean;
}
