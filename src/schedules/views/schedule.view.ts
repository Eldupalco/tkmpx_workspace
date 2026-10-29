import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleUsersSummaryView {
  @ApiProperty({ example: 'Sample name' })
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Sample role' })
  role: string;
}

export class ScheduleView {
  @ApiProperty({ example: 'Sample id' })
  id: string;

  @ApiProperty({ example: 'Sample userId' })
  userId: string;

  @ApiProperty({ example: 1 })
  dayOfWeek: number;

  @ApiProperty({ example: '08:00' })
  startTime: string;

  @ApiProperty({ example: '17:00' })
  endTime: string;

  @ApiProperty({ example: '12:00' })
  breakStart: string;

  @ApiProperty({ example: '13:00' })
  breakEnd: string;

  @ApiProperty({ example: 'Sample shiftName' })
  shiftName: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-10-28T12:00:00.000Z' })
  createdAt: Date | string;

  @ApiProperty({ example: '2026-10-28T12:00:00.000Z' })
  updatedAt: Date | string;

  @ApiPropertyOptional({ type: ScheduleUsersSummaryView })
  users?: ScheduleUsersSummaryView | null;
}

export class PaginatedScheduleView {
  @ApiProperty({ type: [ScheduleView] })
  data: ScheduleView[];

  @ApiProperty({
    example: { total: 42, page: 1, limit: 10, totalPages: 5 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
