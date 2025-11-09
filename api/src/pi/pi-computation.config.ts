import { Injectable } from '@nestjs/common';
import { PiComputationConfig } from '../config/config.interface';
import { ConfigService } from '../config/config.service';

/**
 * @deprecated Use ConfigService.piComputation instead
 * This service is kept for backward compatibility
 */
@Injectable()
export class PiComputationConfigService {
  constructor(private readonly configService: ConfigService) {}

  getConfig(): PiComputationConfig {
    return this.configService.piComputation;
  }
}
