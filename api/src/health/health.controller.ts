import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiResponse as ApiResponseType,
  HealthResponse,
} from '../common/types/api.types';
import type { RequestWithCorrelationId } from '../common/types/request.types';
import { createResponse } from '../common/utils/response.util';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Health status of the application',
  })
  async getHealth(
    @Req() request: RequestWithCorrelationId,
  ): Promise<ApiResponseType<HealthResponse>> {
    const health = await this.healthService.getHealth();
    const correlationId = request.correlationId;
    return createResponse(health, { correlationId });
  }
}
