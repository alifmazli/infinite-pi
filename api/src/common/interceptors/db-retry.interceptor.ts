import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen, take } from 'rxjs/operators';
import { shouldRetryPrismaError } from '../utils/prisma-error.util';

@Injectable()
export class DbRetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DbRetryInterceptor.name);
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000; // 1 second

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryAttempt = index + 1;

            if (!shouldRetryPrismaError(error)) {
              this.logger.warn(`Non-retryable Prisma error: ${error.message}`);
              return throwError(() => error);
            }

            if (retryAttempt > this.maxRetries) {
              this.logger.error(
                `Max retries (${this.maxRetries}) reached for Prisma operation`,
              );
              return throwError(() => error);
            }

            const delay = this.baseDelay * Math.pow(2, index); // Exponential backoff
            this.logger.warn(
              `Retrying Prisma operation (attempt ${retryAttempt}/${this.maxRetries}) after ${delay}ms`,
            );

            return timer(delay);
          }),
          take(this.maxRetries + 1),
        ),
      ),
    );
  }
}
