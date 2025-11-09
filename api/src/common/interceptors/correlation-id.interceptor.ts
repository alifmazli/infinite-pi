import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { RequestWithCorrelationId } from '../types/request.types';

/**
 * Correlation ID interceptor
 * Adds a correlation ID to each request for tracing
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithCorrelationId>();
    const headerValue = request.headers['x-correlation-id'];
    // Handle case where header can be string | string[] | undefined
    const correlationId =
      (Array.isArray(headerValue) ? headerValue[0] : headerValue) || uuidv4();

    // Add to request for use in controllers/services
    request.correlationId = correlationId;

    // Add to response headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-Correlation-ID', correlationId);

    return next.handle();
  }
}
