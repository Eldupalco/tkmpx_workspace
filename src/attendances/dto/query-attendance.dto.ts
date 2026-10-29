import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DATE_PATTERN } from '../../common/utils/date.util.js';

export class QueryAttendanceDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Multi-field search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort column',
    enum: ['date', 'amIn', 'pmIn', 'lateMinutes', 'status', 'createdAt', 'updatedAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['date', 'amIn', 'pmIn', 'lateMinutes', 'status', 'createdAt', 'updatedAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Filter by date' })
  @IsOptional()
  @IsString()
  @Matches(DATE_PATTERN, { message: 'date must be in YYYY-MM-DD format' })
  date?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @Matches(DATE_PATTERN, { message: 'startDate must be in YYYY-MM-DD format' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @Matches(DATE_PATTERN, { message: 'endDate must be in YYYY-MM-DD format' })
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by employee name or email' })
  @IsOptional()
  @IsString()
  employeeSearch?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by userId' })
  @IsOptional()
  @IsString()
  userId?: string;
}
