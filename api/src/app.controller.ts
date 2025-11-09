import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { ApiResponse as ApiResponseType } from './common/types/api.types';
import type { RequestWithCorrelationId } from './common/types/request.types';
import { createResponse } from './common/utils/response.util';

interface RootResponse {
  message: string;
  version: string;
  endpoints: {
    health: string;
    pi: string;
    docs: string;
  };
}

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API root endpoint' })
  @ApiResponse({
    status: 200,
    description: 'API information and available endpoints',
  })
  getRoot(
    @Req() request: RequestWithCorrelationId,
  ): ApiResponseType<RootResponse> {
    const correlationId = request.correlationId;
    const response: RootResponse = {
      message: 'Infinite Pi API',
      version: '1.0',
      endpoints: {
        health: '/api/health',
        pi: '/api/v1/pi',
        docs: '/api/docs',
      },
    };
    return createResponse(response, { correlationId });
  }
}
