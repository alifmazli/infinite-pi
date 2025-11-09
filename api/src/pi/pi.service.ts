import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PiComputationService } from './pi-computation.service';
import { LatestPiValue } from '../common/types/api.types';
import { getPrismaErrorInfo } from '../common/utils/prisma-error.util';

@Injectable()
export class PiService {
  private readonly logger = new Logger(PiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly computationService: PiComputationService,
  ) {}

  /**
   * Get the latest (most accurate) Pi value
   * Uses cache and write buffer for fast access, avoids slow database queries
   * @returns The latest Pi value with its precision and cache status
   */
  async getLatestPiValue(): Promise<LatestPiValue | null> {
    // First, check the computation service for latest value (buffer or cache)
    // This is fast and doesn't hit the database
    const computedValue = this.computationService.getLatestComputedValue();

    if (computedValue) {
      // Check if it's from buffer (not yet flushed) or cache (flushed)
      // Buffer has values, cache has flushed values
      const bufferPrecision =
        this.computationService.getLatestComputedPrecision();
      const fromBuffer =
        bufferPrecision > -1 && bufferPrecision === computedValue.precision;

      return {
        ...computedValue,
        fromCache: !fromBuffer, // If not from buffer, it's from cache
        fromBuffer,
      };
    }

    // Fallback to database only if cache is not initialized
    // This should rarely happen, but provides a safety net
    try {
      const latest = await this.prisma.piValue.findFirst({
        orderBy: { precision: 'desc' },
        select: {
          precision: true,
          value: true,
        },
      });

      if (!latest) {
        return null;
      }

      return {
        value: latest.value,
        precision: latest.precision,
        fromCache: false, // From database, not cache
        fromBuffer: false,
      };
    } catch (error) {
      const errorInfo = getPrismaErrorInfo(error);
      this.logger.error(
        `Database query failed: ${errorInfo?.message || 'Unknown error'}`,
      );
      // If database query fails, return null
      return null;
    }
  }
}
