import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { DATE_PATTERN } from '../../common/utils/date.util.js';

export class CreateAttendanceDto {
  @ApiProperty({ example: 'Sample userId' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ example: '2026-10-29' })
  @IsNotEmpty()
  @IsString()
  @Matches(DATE_PATTERN, { message: 'date must be in YYYY-MM-DD format' })
  date: string;

  @ApiPropertyOptional({ example: '2026-10-29T00:00:00.000Z', description: 'Morning In punch' })
  @IsOptional()
  @IsDateString()
  amIn?: Date | string;

  @ApiPropertyOptional({ example: '2026-10-29T04:00:00.000Z', description: 'Morning Out punch' })
  @IsOptional()
  @IsDateString()
  amOut?: Date | string;

  @ApiPropertyOptional({ example: '2026-10-29T05:00:00.000Z', description: 'Afternoon In punch' })
  @IsOptional()
  @IsDateString()
  pmIn?: Date | string;

  @ApiPropertyOptional({ example: '2026-10-29T09:00:00.000Z', description: 'Afternoon Out punch' })
  @IsOptional()
  @IsDateString()
  pmOut?: Date | string;

  @ApiPropertyOptional({ example: 'Sample status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Sample notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Sample scheduleId' })
  @IsOptional()
  @IsString()
  scheduleId?: string;
}
