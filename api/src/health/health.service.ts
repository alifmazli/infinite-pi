import { Injectable, Logger, Optional, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PiComputationService } from '../pi/pi-computation.service';
import { HealthResponse } from '../common/types/api.types';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(forwardRef(() => PiComputationService))
    private readonly computationService?: PiComputationService,
  ) {}

  async checkDatabase(): Promise<{
    status: 'healthy' | 'unhealthy';
    message?: string;
  }> {
    try {
      // Simple query to check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Database health check failed: ${errorMessage}`);
      return {
        status: 'unhealthy',
        message: errorMessage,
      };
    }
  }

  async checkComputation(): Promise<{
    status: 'healthy' | 'unhealthy';
    message?: string;
  }> {
    if (!this.computationService) {
      return {
        status: 'unhealthy',
        message: 'Computation service not available',
      };
    }

    try {
      // Check if computation service is initialized
      const latestPrecision = this.computationService.getLatestComputedPrecision();
      return {
        status: 'healthy',
        message: `Latest precision: ${latestPrecision >= 0 ? latestPrecision : 'not initialized'}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'unhealthy',
        message: errorMessage,
      };
    }
  }

  async getHealth(): Promise<HealthResponse> {
    const [database, computation] = await Promise.all([
      this.checkDatabase(),
      this.checkComputation(),
    ]);

    const allHealthy =
      database.status === 'healthy' && computation.status === 'healthy';

    return {
      status: allHealthy ? 'ok' : 'error',
      message: allHealthy
        ? 'All services are healthy'
        : 'One or more services are unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database,
        computation,
      },
    };
  }
}

