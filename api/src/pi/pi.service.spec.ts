import { Test, TestingModule } from '@nestjs/testing';
import { PiService } from './pi.service';

describe('PiService', () => {
  let service: PiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PiService],
    }).compile();

    service = module.get<PiService>(PiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
