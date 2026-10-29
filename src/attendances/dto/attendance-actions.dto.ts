import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { DATE_PATTERN } from '../../common/utils/date.util.js';

export class PunchActionDto {
  @ApiPropertyOptional({
    example: 'ca125726-6c1b-4d84-983e-cdd011769c73',
    description: 'Admin only: punch on behalf of this user',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'On-site' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class LeaveActionDto {
  @ApiProperty({ example: '2026-11-15' })
  @IsNotEmpty()
  @IsString()
  @Matches(DATE_PATTERN, { message: 'date must be in YYYY-MM-DD format' })
  date: string;

  @ApiPropertyOptional({ example: 'ca125726-6c1b-4d84-983e-cdd011769c73' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'on_leave' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Annual PTO vacation' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TimesheetQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsString()
  @Matches(DATE_PATTERN, { message: 'startDate must be in YYYY-MM-DD format' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @IsString()
  @Matches(DATE_PATTERN, { message: 'endDate must be in YYYY-MM-DD format' })
  endDate?: string;

  @ApiPropertyOptional({ example: 'ca125726-6c1b-4d84-983e-cdd011769c73' })
  @IsOptional()
  @IsString()
  userId?: string;
}

