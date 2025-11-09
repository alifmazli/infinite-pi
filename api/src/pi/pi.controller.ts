import { Controller, Get } from '@nestjs/common';
import { PiService } from './pi.service';

@Controller('pi')
export class PiController {
  constructor(private readonly piService: PiService) {}

  @Get()
  async getPiValue() {
    const result = await this.piService.getLatestPiValue();
    
    if (!result) {
      return {
        value: '3',
        decimalPlaces: 0,
        cached: false,
        message: 'No Pi value found in database',
      };
    }

    // Determine if value is cached (from cache or buffer, not fresh DB query)
    const cached = result.fromCache || result.fromBuffer;

    return {
      value: result.value,
      decimalPlaces: result.precision,
      cached,
      cachedAt: cached ? new Date().toISOString() : undefined,
    };
  }
}
