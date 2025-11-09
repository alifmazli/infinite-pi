/**
 * Application configuration interfaces
 */

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  cors: {
    origins: string[];
    methods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
}

export interface DatabaseConfig {
  url: string;
}

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

export interface ThrottleConfig {
  ttl: number; // Time window in seconds
  limit: number; // Max requests per window
}

export interface AllConfig {
  app: AppConfig;
  database: DatabaseConfig;
  piComputation: PiComputationConfig;
  throttle: ThrottleConfig;
}
