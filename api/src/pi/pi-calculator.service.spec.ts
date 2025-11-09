import { Test, TestingModule } from '@nestjs/testing';
import { PiCalculatorService } from './pi-calculator.service';
import { PiComputationConfigService } from './pi-computation.config';
import { ConfigService } from '../config/config.service';

describe('PiCalculatorService', () => {
  let service: PiCalculatorService;
  let configService: ConfigService;

  const mockConfigService = {
    piComputation: {
      incrementLow: 10,
      incrementMedium: 1000,
      incrementHighPercent: 5,
    },
  };

  const mockPiComputationConfigService = {
    getConfig: jest.fn(() => mockConfigService.piComputation),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PiCalculatorService,
        {
          provide: PiComputationConfigService,
          useValue: mockPiComputationConfigService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PiCalculatorService>(PiCalculatorService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePi', () => {
    it('should return "3" for precision 0', () => {
      const result = service.calculatePi(0);
      expect(result).toBe('3');
    });

    it('should return "3" for negative precision', () => {
      const result = service.calculatePi(-1);
      expect(result).toBe('3');
    });

    it('should calculate Pi for low precision', () => {
      const result = service.calculatePi(5);
      expect(result).toBeTruthy();
      expect(result).toMatch(/^3\.\d+$/);
      expect(result.split('.')[1]?.length).toBeLessThanOrEqual(5);
    });
  });

  describe('calculatePiAsync', () => {
    it('should return "3" for precision 0', async () => {
      const result = await service.calculatePiAsync(0);
      expect(result).toBe('3');
    });

    it('should calculate Pi asynchronously', async () => {
      const result = await service.calculatePiAsync(10);
      expect(result).toBeTruthy();
      expect(result).toMatch(/^3\.\d+$/);
      expect(result.split('.')[1]?.length).toBeLessThanOrEqual(10);
    }, 10000);
  });

  describe('getNextPrecision', () => {
    it('should use low increment for precision < 1000', () => {
      const result = service.getNextPrecision(100);
      expect(result).toBe(110); // 100 + 10
    });

    it('should use medium increment for precision 1000-100k', () => {
      const result = service.getNextPrecision(5000);
      expect(result).toBe(6000); // 5000 + 1000
    });

    it('should use percentage increment for precision > 100k', () => {
      const result = service.getNextPrecision(200000);
      // 5% of 200000 = 10000, but min is max(10000, 2000) = 10000
      expect(result).toBe(210000); // 200000 + 10000
    });

    it('should handle edge case at 1000', () => {
      const result = service.getNextPrecision(999);
      expect(result).toBe(1009); // 999 + 10 (low increment)
    });

    it('should handle edge case at 100000', () => {
      const result = service.getNextPrecision(99999);
      expect(result).toBe(100999); // 99999 + 1000 (medium increment)
    });
  });
});

