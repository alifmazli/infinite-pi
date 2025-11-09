import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LatestPiValue } from '../common/types/api.types';
import { PrismaService } from '../prisma/prisma.service';
import { PiComputationService } from './pi-computation.service';
import { PiService } from './pi.service';

describe('PiService', () => {
  let service: PiService;
  let prismaService: PrismaService;
  let computationService: PiComputationService;

  const mockPrismaService = {
    piValue: {
      findFirst: jest.fn(),
    },
  };

  const mockComputationService = {
    getLatestComputedValue: jest.fn(),
    getLatestComputedPrecision: jest.fn(),
  };

  beforeEach(async () => {
    // Suppress logger output during tests for cleaner test output
    // This prevents error logs from cluttering test output while keeping
    // error logging behavior intact in production
    Logger.overrideLogger(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PiService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PiComputationService,
          useValue: mockComputationService,
        },
      ],
    }).compile();

    service = module.get<PiService>(PiService);
    prismaService = module.get<PrismaService>(PrismaService);
    computationService = module.get<PiComputationService>(PiComputationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLatestPiValue', () => {
    it('should return value from computation service cache', async () => {
      const mockValue: LatestPiValue = {
        value: '3.14159',
        precision: 5,
        fromCache: true,
        fromBuffer: false,
      };

      mockComputationService.getLatestComputedValue.mockReturnValue({
        value: '3.14159',
        precision: 5,
      });
      mockComputationService.getLatestComputedPrecision.mockReturnValue(-1);

      const result = await service.getLatestPiValue();

      expect(result).toEqual(mockValue);
      expect(mockComputationService.getLatestComputedValue).toHaveBeenCalled();
      expect(mockPrismaService.piValue.findFirst).not.toHaveBeenCalled();
    });

    it('should return value from computation service buffer', async () => {
      const mockValue: LatestPiValue = {
        value: '3.1415926535',
        precision: 10,
        fromCache: false,
        fromBuffer: true,
      };

      mockComputationService.getLatestComputedValue.mockReturnValue({
        value: '3.1415926535',
        precision: 10,
      });
      mockComputationService.getLatestComputedPrecision.mockReturnValue(10);

      const result = await service.getLatestPiValue();

      expect(result).toEqual(mockValue);
      expect(mockComputationService.getLatestComputedValue).toHaveBeenCalled();
      expect(mockPrismaService.piValue.findFirst).not.toHaveBeenCalled();
    });

    it('should fallback to database when computation service returns null', async () => {
      const mockDbValue = {
        value: '3.14159',
        precision: 5,
      };

      mockComputationService.getLatestComputedValue.mockReturnValue(null);
      mockPrismaService.piValue.findFirst.mockResolvedValue(mockDbValue);

      const result = await service.getLatestPiValue();

      expect(result).toEqual({
        value: '3.14159',
        precision: 5,
        fromCache: false,
        fromBuffer: false,
      });
      expect(mockPrismaService.piValue.findFirst).toHaveBeenCalled();
    });

    it('should return null when no value is found', async () => {
      mockComputationService.getLatestComputedValue.mockReturnValue(null);
      mockPrismaService.piValue.findFirst.mockResolvedValue(null);

      const result = await service.getLatestPiValue();

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockComputationService.getLatestComputedValue.mockReturnValue(null);
      mockPrismaService.piValue.findFirst.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getLatestPiValue();

      expect(result).toBeNull();
    });
  });
});
