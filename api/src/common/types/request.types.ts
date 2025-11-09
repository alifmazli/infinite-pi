import { Request } from 'express';

/**
 * Extended Express Request with correlation ID
 */
export interface RequestWithCorrelationId extends Request {
  correlationId?: string;
}

