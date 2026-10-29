import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CheckInActionDto {
  @ApiPropertyOptional({ example: 'ca125726-6c1b-4d84-983e-cdd011769c73' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'Morning on-site arrival' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CheckOutActionDto {
  @ApiPropertyOptional({ example: 'Completed workday' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class LeaveActionDto {
  @ApiProperty({ example: '2026-11-15' })
  @IsNotEmpty()
  @IsString()
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
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'ca125726-6c1b-4d84-983e-cdd011769c73' })
  @IsOptional()
  @IsString()
  userId?: string;
}

