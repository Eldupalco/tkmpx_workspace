import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAttendanceDto {
  @ApiProperty({ example: 'Sample userId' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Sample date' })
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiPropertyOptional({ example: '2026-10-28T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  checkInTime?: Date | string;

  @ApiPropertyOptional({ example: '2026-10-28T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  checkOutTime?: Date | string;

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
