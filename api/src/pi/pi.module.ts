import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule } from '../config/config.module';
import { PiCalculatorService } from './pi-calculator.service';
import { PiComputationConfigService } from './pi-computation.config';
import { PiComputationService } from './pi-computation.service';
import { PiController } from './pi.controller';
import { PiService } from './pi.service';

@Module({
  imports: [ConfigModule],
  controllers: [PiController],
  providers: [
    PiService,
    PiComputationConfigService,
    PiCalculatorService,
    PiComputationService,
    PrismaService,
  ],
  exports: [PiComputationService, PiService],
})
export class PiModule {}
