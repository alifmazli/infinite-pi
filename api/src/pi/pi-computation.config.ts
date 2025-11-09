import { Injectable } from '@nestjs/common';
import { getEnvBoolean, getEnvNumber } from '../utils/env.util';

export interface PiComputationConfig {
  // Increment strategy
  incrementLow: number; // Increment for precision < 1000
  incrementMedium: number; // Increment for precision 1000-100k
  incrementHighPercent: number; // Percentage for precision > 100k

  // Write batching
  writeBatchSize: number; // Batch N writes together
  writeBatchIntervalMs: number; // Or flush every N ms

  // Cleanup strategy
  cleanupEnabled: boolean; // Enable cleanup of old values
  cleanupKeepMilestones: boolean; // Keep milestone precisions
  cleanupMinPrecision: number; // Keep values above this precision
}

@Injectable()
export class PiComputationConfigService {
  private readonly config: PiComputationConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): PiComputationConfig {
    return {
      // Increment strategy - adaptive based on precision
      incrementLow: getEnvNumber('PI_INCREMENT_LOW', 10),
      incrementMedium: getEnvNumber('PI_INCREMENT_MEDIUM', 1000),
      incrementHighPercent: getEnvNumber('PI_INCREMENT_HIGH_PERCENT', 5),

      // Write batching - reduce DB overhead
      writeBatchSize: getEnvNumber('PI_WRITE_BATCH_SIZE', 10),
      writeBatchIntervalMs: getEnvNumber('PI_WRITE_BATCH_INTERVAL_MS', 5000),

      // Cleanup strategy - manage DB growth
      cleanupEnabled: getEnvBoolean('PI_DB_CLEANUP_ENABLED', false),
      cleanupKeepMilestones: getEnvBoolean(
        'PI_DB_CLEANUP_KEEP_MILESTONES',
        true,
      ),
      cleanupMinPrecision: getEnvNumber('PI_DB_CLEANUP_MIN_PRECISION', 1000),
    };
  }

  private validateConfig(): void {
    if (this.config.incrementLow <= 0) {
      throw new Error('PI_INCREMENT_LOW must be > 0');
    }
    if (this.config.incrementMedium <= 0) {
      throw new Error('PI_INCREMENT_MEDIUM must be > 0');
    }
    if (
      this.config.incrementHighPercent <= 0 ||
      this.config.incrementHighPercent > 100
    ) {
      throw new Error('PI_INCREMENT_HIGH_PERCENT must be between 1 and 100');
    }
    if (this.config.writeBatchSize <= 0) {
      throw new Error('PI_WRITE_BATCH_SIZE must be > 0');
    }
    if (this.config.writeBatchIntervalMs <= 0) {
      throw new Error('PI_WRITE_BATCH_INTERVAL_MS must be > 0');
    }
    if (this.config.cleanupMinPrecision < 0) {
      throw new Error('PI_DB_CLEANUP_MIN_PRECISION must be >= 0');
    }
  }

  getConfig(): PiComputationConfig {
    return { ...this.config };
  }
}
