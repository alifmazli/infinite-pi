import { ConfigService as NestConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let nestConfigService: NestConfigService;

  const mockNestConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: NestConfigService,
          useValue: mockNestConfigService,
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
    nestConfigService = module.get<NestConfigService>(NestConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('app', () => {
    it('should return app configuration with defaults', () => {
      mockNestConfigService.get.mockImplementation(
        (key: string, defaultValue: unknown) => {
          const values: Record<string, unknown> = {
            PORT: 3001,
            NODE_ENV: 'development',
            ALLOWED_ORIGINS: 'http://localhost:3000',
          };
          return values[key] ?? defaultValue;
        },
      );

      const config = service.app;

      expect(config.port).toBe(3001);
      expect(config.nodeEnv).toBe('development');
      expect(config.cors.origins).toContain('http://localhost:3000');
    });

    it('should parse multiple CORS origins', () => {
      mockNestConfigService.get.mockImplementation(
        (key: string, defaultValue: unknown) => {
          const values: Record<string, unknown> = {
            PORT: 3001,
            NODE_ENV: 'development',
            ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:3002',
          };
          return values[key] ?? defaultValue;
        },
      );

      const config = service.app;

      expect(config.cors.origins).toHaveLength(2);
      expect(config.cors.origins).toContain('http://localhost:3000');
      expect(config.cors.origins).toContain('http://localhost:3002');
    });
  });

  describe('piComputation', () => {
    it('should return pi computation configuration with defaults', () => {
      mockNestConfigService.get.mockImplementation(
        (key: string, defaultValue: unknown) => {
          const values: Record<string, unknown> = {
            PI_INCREMENT_LOW: 10,
            PI_INCREMENT_MEDIUM: 1000,
            PI_INCREMENT_HIGH_PERCENT: 5,
            PI_WRITE_BATCH_SIZE: 10,
            PI_WRITE_BATCH_INTERVAL_MS: 5000,
            PI_DB_CLEANUP_ENABLED: false,
            PI_DB_CLEANUP_KEEP_MILESTONES: true,
            PI_DB_CLEANUP_MIN_PRECISION: 1000,
          };
          return values[key] ?? defaultValue;
        },
      );

      const config = service.piComputation;

      expect(config.incrementLow).toBe(10);
      expect(config.incrementMedium).toBe(1000);
      expect(config.incrementHighPercent).toBe(5);
      expect(config.writeBatchSize).toBe(10);
      expect(config.writeBatchIntervalMs).toBe(5000);
      expect(config.cleanupEnabled).toBe(false);
      expect(config.cleanupKeepMilestones).toBe(true);
      expect(config.cleanupMinPrecision).toBe(1000);
    });
  });
});
