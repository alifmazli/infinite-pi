import { Controller, Get, Version, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { RequestWithCorrelationId } from '../common/types/request.types';
import { PiService } from './pi.service';
import { GetPiResponseDto } from './dto/get-pi-response.dto';
import { createResponse } from '../common/utils/response.util';
import { PiValueResponse, ApiResponse as ApiResponseType } from '../common/types/api.types';

@ApiTags('Pi')
@Controller({ path: 'pi', version: '1' })
export class PiController {
  constructor(private readonly piService: PiService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Get the latest Pi value' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current most accurate Pi value',
    type: GetPiResponseDto,
  })
  async getPiValue(@Req() request: RequestWithCorrelationId): Promise<ApiResponseType<PiValueResponse>> {
    const result = await this.piService.getLatestPiValue();
    const correlationId = request.correlationId;

    if (!result) {
      const defaultResponse: PiValueResponse = {
        value: '3',
        decimalPlaces: 0,
        cached: false,
      };
      return createResponse(defaultResponse, { correlationId });
    }

    // Determine if value is cached (from cache or buffer, not fresh DB query)
    const cached = result.fromCache || result.fromBuffer;

    const response: PiValueResponse = {
      value: result.value,
      decimalPlaces: result.precision,
      cached,
      cachedAt: cached ? new Date().toISOString() : undefined,
    };

    return createResponse(response, { correlationId });
  }
}
