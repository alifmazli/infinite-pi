import { Prisma } from '@prisma/client';

/**
 * Prisma error types
 */
export enum PrismaErrorCode {
  UNIQUE_CONSTRAINT = 'P2002',
  RECORD_NOT_FOUND = 'P2025',
  FOREIGN_KEY_CONSTRAINT = 'P2003',
  CONNECTION_ERROR = 'P1001',
  DATABASE_TIMEOUT = 'P1008',
  QUERY_INTERPRETATION_ERROR = 'P2012',
  QUERY_VALIDATION_ERROR = 'P2013',
}

export interface PrismaErrorInfo {
  code: PrismaErrorCode | string;
  message: string;
  isRetryable: boolean;
  isUniqueConstraint: boolean;
  isConnectionError: boolean;
}

/**
 * Check if error is a Prisma error
 */
export function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as Prisma.PrismaClientKnownRequestError).code === 'string'
  );
}

/**
 * Extract Prisma error information
 */
export function getPrismaErrorInfo(
  error: unknown,
): PrismaErrorInfo | null {
  if (!isPrismaError(error)) {
    return null;
  }

  const code = error.code as PrismaErrorCode;
  const isUniqueConstraint = code === PrismaErrorCode.UNIQUE_CONSTRAINT;
  const isConnectionError =
    code === PrismaErrorCode.CONNECTION_ERROR ||
    code === PrismaErrorCode.DATABASE_TIMEOUT;

  const isRetryable =
    isConnectionError ||
    code === PrismaErrorCode.QUERY_INTERPRETATION_ERROR ||
    code === PrismaErrorCode.QUERY_VALIDATION_ERROR;

  return {
    code,
    message: error.message,
    isRetryable,
    isUniqueConstraint,
    isConnectionError,
  };
}

/**
 * Check if error should be retried
 */
export function shouldRetryPrismaError(error: unknown): boolean {
  const info = getPrismaErrorInfo(error);
  return info?.isRetryable ?? false;
}

