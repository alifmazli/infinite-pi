import { ApiProperty } from '@nestjs/swagger';
import { PiValueResponse } from '../../common/types/api.types';

export class GetPiResponseDto implements PiValueResponse {
  @ApiProperty({
    description: 'The Pi value as a string',
    example: '3.141592653589793238462643383279',
  })
  value: string;

  @ApiProperty({
    description: 'Number of decimal places',
    example: 30,
  })
  decimalPlaces: number;

  @ApiProperty({
    description: 'Whether the value is from cache',
    example: true,
  })
  cached: boolean;

  @ApiProperty({
    description: 'ISO timestamp when value was cached',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  cachedAt?: string;
}

