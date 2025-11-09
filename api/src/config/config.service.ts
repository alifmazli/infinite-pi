import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import {
  AllConfig,
  AppConfig,
  DatabaseConfig,
  PiComputationConfig,
  ThrottleConfig,
} from './config.interface';
import { defaultConfig } from './config.schema';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get app(): AppConfig {
    const origins = this.configService
      .get<string>('ALLOWED_ORIGINS', defaultConfig.ALLOWED_ORIGINS)
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    return {
      port: this.configService.get<number>('PORT', defaultConfig.PORT),
      nodeEnv: this.configService.get<'development' | 'production' | 'test'>(
        'NODE_ENV',
        defaultConfig.NODE_ENV as 'development' | 'production' | 'test',
      ),
      cors: {
        origins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      },
    };
  }

  get database(): DatabaseConfig {
    return {
      url:
        this.configService.get<string>(
          'DATABASE_URL',
          defaultConfig.DATABASE_URL,
        ) || '',
    };
  }

  get piComputation(): PiComputationConfig {
    return {
      incrementLow: this.configService.get<number>(
        'PI_INCREMENT_LOW',
        defaultConfig.PI_INCREMENT_LOW,
      ),
      incrementMedium: this.configService.get<number>(
        'PI_INCREMENT_MEDIUM',
        defaultConfig.PI_INCREMENT_MEDIUM,
      ),
      incrementHighPercent: this.configService.get<number>(
        'PI_INCREMENT_HIGH_PERCENT',
        defaultConfig.PI_INCREMENT_HIGH_PERCENT,
      ),
      writeBatchSize: this.configService.get<number>(
        'PI_WRITE_BATCH_SIZE',
        defaultConfig.PI_WRITE_BATCH_SIZE,
      ),
      writeBatchIntervalMs: this.configService.get<number>(
        'PI_WRITE_BATCH_INTERVAL_MS',
        defaultConfig.PI_WRITE_BATCH_INTERVAL_MS,
      ),
      cleanupEnabled: this.configService.get<boolean>(
        'PI_DB_CLEANUP_ENABLED',
        defaultConfig.PI_DB_CLEANUP_ENABLED,
      ),
      cleanupKeepMilestones: this.configService.get<boolean>(
        'PI_DB_CLEANUP_KEEP_MILESTONES',
        defaultConfig.PI_DB_CLEANUP_KEEP_MILESTONES,
      ),
      cleanupMinPrecision: this.configService.get<number>(
        'PI_DB_CLEANUP_MIN_PRECISION',
        defaultConfig.PI_DB_CLEANUP_MIN_PRECISION,
      ),
    };
  }

  get throttle(): ThrottleConfig {
    return {
      ttl: this.configService.get<number>(
        'THROTTLE_TTL',
        defaultConfig.THROTTLE_TTL,
      ),
      limit: this.configService.get<number>(
        'THROTTLE_LIMIT',
        defaultConfig.THROTTLE_LIMIT,
      ),
    };
  }

  get all(): AllConfig {
    return {
      app: this.app,
      database: this.database,
      piComputation: this.piComputation,
      throttle: this.throttle,
    };
  }
}
