import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScheduleDto {
  @ApiProperty({ example: 'Sample userId' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  dayOfWeek: number;

  @ApiProperty({ example: 'Sample startTime' })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty({ example: 'Sample endTime' })
  @IsNotEmpty()
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ example: 'Sample shiftName' })
  @IsOptional()
  @IsString()
  shiftName?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
