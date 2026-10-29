import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TIME_PATTERN } from '../../common/utils/date.util.js';

export class CreateScheduleDto {
  @ApiProperty({ example: 'Sample userId' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 1, description: '1=Monday, 7=Sunday' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm (24-hour) format' })
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'endTime must be in HH:mm (24-hour) format' })
  endTime: string;

  @ApiPropertyOptional({ example: '12:00', default: '12:00', description: 'Lunch break start' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'breakStart must be in HH:mm (24-hour) format' })
  breakStart?: string;

  @ApiPropertyOptional({ example: '13:00', default: '13:00', description: 'Lunch break end' })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'breakEnd must be in HH:mm (24-hour) format' })
  breakEnd?: string;

  @ApiPropertyOptional({ example: 'Sample shiftName' })
  @IsOptional()
  @IsString()
  shiftName?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
