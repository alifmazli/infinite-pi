import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { getPrismaErrorInfo } from '../common/utils/prisma-error.util';
import { PrismaService } from '../prisma/prisma.service';
import { PiCalculatorService } from './pi-calculator.service';
import { PiComputationConfigService } from './pi-computation.config';

interface PendingWrite {
  precision: number;
  value: string;
  computedAt: number;
}

@Injectable()
export class PiComputationService implements OnModuleDestroy {
  private initializationStarted = false;
  private readonly logger = new Logger(PiComputationService.name);
  private isComputing = false;
  private computationInterval: NodeJS.Timeout | null = null;
  private initialComputationStartTime: number | null = null;

  // Write batching
  private writeBuffer: PendingWrite[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;

  // Cache for latest value (updated when buffer flushes)
  private latestValueCache: { value: string; precision: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly piCalculator: PiCalculatorService,
    private readonly config: PiComputationConfigService,
  ) {}

  // Non-blocking initialization - start after a delay to ensure server is ready
  // This is called from constructor or can be called manually
  private startInitialization(): void {
    if (this.initializationStarted) {
      return;
    }
    this.initializationStarted = true;

    // Use setTimeout with a small delay to ensure server is fully listening
    // This runs completely independently and won't block anything
    setTimeout(async () => {
      try {
        this.logger.log('Starting Pi computation service initialization...');
        const config = this.config.getConfig();
        this.logger.log(
          `Configuration: increments (${config.incrementLow}/${config.incrementMedium}/${config.incrementHighPercent}%), batch size: ${config.writeBatchSize}, interval: ${config.writeBatchIntervalMs}ms`,
        );

        // Add timeout to database operations to prevent hanging
        const initPromise = Promise.all([
          this.initializeDatabase(),
          this.cacheInitialComputationTime(),
          this.initializeCache(),
        ]);

        await Promise.race([
          initPromise,
          new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(new Error('Database initialization timeout after 15s')),
              15000,
            ),
          ),
        ]);

        // Start flush timer for write batching
        this.startFlushTimer();

        // Start continuous computation (don't await - it runs forever)
        this.startComputation().catch((error) => {
          this.logger.error(
            `Fatal error in computation loop: ${error.message}`,
            error.stack,
          );
          this.isComputing = false;
        });

        this.logger.log('Pi computation service initialized successfully');
      } catch (error) {
        this.logger.error(
          `Failed to initialize computation service: ${error.message}`,
          error.stack,
        );
        // Don't throw - server is already running, just log the error
        // The service will just be in an uninitialized state
      }
    }, 100); // 100ms delay to ensure server is listening
  }

  // Public method to trigger initialization (can be called from main.ts after server starts)
  public initialize(): void {
    this.startInitialization();
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down computation service...');
    this.stopComputation();
    // Flush any pending writes before shutdown
    await this.flushWriteBuffer();
  }

  /**
   * Initialize database with initial Pi value if empty
   */
  private async initializeDatabase(): Promise<void> {
    const existingValue = await this.prisma.piValue.findFirst({
      orderBy: { precision: 'desc' },
    });

    if (!existingValue) {
      // Start with basic value
      const initialValue = '3';
      await this.prisma.piValue.create({
        data: {
          value: initialValue,
          precision: 0,
        },
      });
      this.logger.log(`Initialized database with Pi value: ${initialValue}`);
    }
  }

  /**
   * Cache the initial computation start time from the first entry
   */
  private async cacheInitialComputationTime(): Promise<void> {
    const initialEntry = await this.prisma.piValue.findFirst({
      orderBy: { precision: 'asc' },
    });

    if (initialEntry) {
      this.initialComputationStartTime = initialEntry.createdAt.getTime();
    }
  }

  /**
   * Initialize the cache with the latest value from database
   * This avoids slow database queries on every API request
   */
  private async initializeCache(): Promise<void> {
    try {
      // Use a lightweight query - only get precision first, then value if needed
      const latest = await this.prisma.piValue.findFirst({
        orderBy: { precision: 'desc' },
        select: {
          precision: true,
          value: true,
        },
      });

      if (latest) {
        this.latestValueCache = {
          value: latest.value,
          precision: latest.precision,
        };
        this.logger.debug(
          `Initialized cache with precision ${latest.precision} dp`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to initialize cache: ${error.message}. Will retry on first flush.`,
      );
    }
  }

  /**
   * Get the latest computed precision (including values in write buffer)
   * This allows the API to return the most recent value even if not yet flushed to DB
   */
  getLatestComputedPrecision(): number {
    // Trigger lazy initialization if not started
    this.startInitialization();

    // Check write buffer for latest precision
    if (this.writeBuffer.length > 0) {
      const latestInBuffer = Math.max(
        ...this.writeBuffer.map((w) => w.precision),
      );
      return latestInBuffer;
    }
    return -1; // No value in buffer
  }

  /**
   * Get the latest computed value (including values in write buffer)
   * Returns the highest precision value from buffer or cache
   */
  getLatestComputedValue(): { value: string; precision: number } | null {
    // Trigger lazy initialization if not started
    this.startInitialization();
    // Check write buffer first (most recent)
    if (this.writeBuffer.length > 0) {
      const latestInBuffer = this.writeBuffer.reduce((prev, current) =>
        current.precision > prev.precision ? current : prev,
      );
      return {
        value: latestInBuffer.value,
        precision: latestInBuffer.precision,
      };
    }

    // Fall back to cache
    return this.latestValueCache;
  }

  /**
   * Stop continuous computation
   */
  stopComputation(): void {
    if (this.computationInterval) {
      clearInterval(this.computationInterval);
      this.computationInterval = null;
    }
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.isComputing = false;
    this.logger.log('Stopped Pi computation');
  }

  /**
   * Start the flush timer for write batching
   */
  private startFlushTimer(): void {
    const config = this.config.getConfig();
    this.flushTimer = setInterval(() => {
      this.flushWriteBuffer().catch((error) => {
        this.logger.error(
          `Error flushing write buffer: ${error.message}`,
          error.stack,
        );
      });
    }, config.writeBatchIntervalMs);
  }

  /**
   * Add a computed value to the write buffer
   */
  private addToWriteBuffer(precision: number, value: string): void {
    this.writeBuffer.push({
      precision,
      value,
      computedAt: Date.now(),
    });

    const config = this.config.getConfig();
    // Flush if buffer reaches batch size
    if (this.writeBuffer.length >= config.writeBatchSize) {
      this.flushWriteBuffer().catch((error) => {
        this.logger.error(
          `Error flushing write buffer: ${error.message}`,
          error.stack,
        );
      });
    }
  }

  /**
   * Flush pending writes to database
   */
  private async flushWriteBuffer(): Promise<void> {
    if (this.isFlushing || this.writeBuffer.length === 0) {
      return;
    }

    this.isFlushing = true;
    const buffer = [...this.writeBuffer];
    this.writeBuffer = [];

    try {
      // Use transaction for batch insert
      await this.prisma.$transaction(
        buffer.map((item) =>
          this.prisma.piValue.upsert({
            where: { precision: item.precision },
            update: { value: item.value },
            create: {
              precision: item.precision,
              value: item.value,
            },
          }),
        ),
      );

      this.logger.debug(
        `Flushed ${buffer.length} values to database (precisions: ${buffer.map((b) => b.precision).join(', ')})`,
      );

      // Update cache with the latest value from the flush
      const latestFlushed = buffer.reduce((prev, current) =>
        current.precision > prev.precision ? current : prev,
      );
      this.latestValueCache = {
        value: latestFlushed.value,
        precision: latestFlushed.precision,
      };

      // Run cleanup if enabled
      if (this.config.getConfig().cleanupEnabled) {
        await this.runCleanup();
      }
    } catch (error) {
      // Handle Prisma errors properly
      const errorInfo = getPrismaErrorInfo(error);

      if (errorInfo?.isUniqueConstraint) {
        this.logger.debug(
          `Some values already exist in database (expected), continuing...`,
        );
      } else {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Error flushing write buffer: ${errorMessage}`,
          errorStack,
        );
        // Re-add failed items to buffer
        this.writeBuffer.unshift(...buffer);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Cleanup old database values based on configuration
   */
  private async runCleanup(): Promise<void> {
    const config = this.config.getConfig();
    if (!config.cleanupEnabled) {
      return;
    }

    try {
      // Get all values below minimum precision
      const valuesToDelete = await this.prisma.piValue.findMany({
        where: {
          precision: {
            lt: config.cleanupMinPrecision,
          },
        },
        orderBy: { precision: 'desc' },
      });

      if (valuesToDelete.length === 0) {
        return;
      }

      // If keeping milestones, filter them out
      let toDelete = valuesToDelete;
      if (config.cleanupKeepMilestones) {
        // Define milestone precisions to keep
        const milestones = [
          0, 10, 100, 1000, 5000, 10000, 20000, 50000, 100000, 200000, 500000,
          1000000,
        ];
        toDelete = valuesToDelete.filter(
          (v) => !milestones.includes(v.precision),
        );
      }

      if (toDelete.length > 0) {
        await this.prisma.piValue.deleteMany({
          where: {
            precision: {
              in: toDelete.map((v) => v.precision),
            },
          },
        });
        this.logger.debug(
          `Cleaned up ${toDelete.length} old values from database`,
        );
      }
    } catch (error) {
      this.logger.error(`Error during cleanup: ${error.message}`, error.stack);
    }
  }

  /**
   * Compute the next precision level of Pi and update database
   */
  // In your Prisma schema, ensure `precision` is unique on piValue
  // model PiValue {
  //   id        Int      @id @default(autoincrement())
  //   precision Int      @unique
  //   value     String
  //   updatedAt DateTime @updatedAt
  // }

  private running = false;

  private async computeNextPrecision(): Promise<void> {
    if (this.running) {
      this.logger.debug('Computation already running, skipping...');
      return;
    }
    this.running = true;
    const startTime = Date.now();
    try {
      this.logger.debug('Fetching current highest precision from database...');
      const currentValue = await this.prisma.piValue.findFirst({
        orderBy: { precision: 'desc' },
      });

      if (!currentValue) {
        this.logger.log('No existing value found, initializing database...');
        await this.initializeDatabase();
        return;
      }

      this.logger.debug(
        `Current highest precision: ${currentValue.precision} dp`,
      );

      // Calculate the next precision to compute
      let nextPrecision = this.piCalculator.getNextPrecision(
        currentValue.precision,
      );
      this.logger.debug(`Next target precision: ${nextPrecision} dp`);

      // Check if this precision already exists in the database
      // If it does, find the next precision that doesn't exist
      let existingValue = await this.prisma.piValue.findUnique({
        where: { precision: nextPrecision },
      });

      // Keep finding the next precision until we find one that doesn't exist
      // Safety check: prevent infinite loops (max 100 iterations)
      let iterations = 0;
      const maxIterations = 100;
      while (existingValue && iterations < maxIterations) {
        this.logger.debug(
          `Precision ${nextPrecision} already exists, finding next...`,
        );
        const previousPrecision = nextPrecision;
        nextPrecision = this.piCalculator.getNextPrecision(nextPrecision);

        // Safety check: if precision didn't increase, break to avoid infinite loop
        if (nextPrecision <= previousPrecision) {
          this.logger.warn(
            `getNextPrecision returned same or lower precision (${previousPrecision} -> ${nextPrecision}). Stopping to avoid infinite loop.`,
          );
          break;
        }

        existingValue = await this.prisma.piValue.findUnique({
          where: { precision: nextPrecision },
        });
        iterations++;
      }

      if (iterations >= maxIterations) {
        this.logger.error(
          `Reached max iterations (${maxIterations}) while finding next precision. This might indicate all precisions up to a very high value already exist.`,
        );
        // Add a delay before retrying to avoid tight loop
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return;
      }

      if (existingValue) {
        this.logger.warn(
          `Precision ${nextPrecision} still exists after iteration loop. Skipping computation.`,
        );
        return;
      }

      this.logger.log(`Computing Pi to ${nextPrecision} decimal places...`);

      // Compute the new value for the next precision
      // ALWAYS use async version to avoid blocking event loop, even for low precision
      // This ensures HTTP requests can be processed during computation
      const newValue = await this.piCalculator.calculatePiAsync(nextPrecision);

      this.logger.debug(`Computation complete, adding to write buffer...`);

      // Add to write buffer (will be flushed in batch)
      this.addToWriteBuffer(nextPrecision, newValue);

      const duration = (Date.now() - startTime) / 1000;
      const totalElapsed = this.initialComputationStartTime
        ? (Date.now() - this.initialComputationStartTime) / 1000
        : 0;

      this.logger.log(
        `✓ Computed Pi to ${nextPrecision} dp in ${duration.toFixed(3)}s (total elapsed: ${totalElapsed.toFixed(3)}s, buffer: ${this.writeBuffer.length})`,
      );
    } catch (error) {
      this.logger.error(`Error computing Pi: ${error.message}`, error.stack);
      // Add a small delay on error to avoid tight error loop
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      this.running = false;
    }
  }

  // Optionally, replace setInterval with an await loop:
  private async startComputation(): Promise<void> {
    if (this.isComputing) {
      this.logger.warn(
        'Computation already started, ignoring duplicate start request',
      );
      return;
    }
    this.isComputing = true;
    this.logger.log('Starting continuous Pi computation...');

    try {
      // eslint-disable-next-line no-constant-condition
      while (this.isComputing) {
        await this.computeNextPrecision();
        // Add a longer delay to ensure other requests get processed
        // This is critical - gives the event loop time to handle HTTP requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      this.logger.error(
        `Fatal error in computation loop: ${error.message}`,
        error.stack,
      );
      this.isComputing = false;
      throw error;
    }
  }
}
