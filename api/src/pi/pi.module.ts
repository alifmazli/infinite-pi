import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PiCalculatorService } from './pi-calculator.service';
import { PiComputationConfigService } from './pi-computation.config';
import { PiComputationService } from './pi-computation.service';
import { PiController } from './pi.controller';
import { PiService } from './pi.service';

@Module({
  controllers: [PiController],
  providers: [
    PiService,
    PiComputationConfigService,
    PiCalculatorService,
    PiComputationService,
    PrismaService,
  ],
})
export class PiModule {}
