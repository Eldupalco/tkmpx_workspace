import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserView {
  @ApiProperty({ example: 'Sample id' })
  id: string;

  @ApiProperty({ example: 'Sample name' })
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'Sample role' })
  role: string;

  @ApiProperty({ example: '2026-10-28T12:00:00.000Z' })
  createdAt: Date | string;

  @ApiProperty({ example: '2026-10-28T12:00:00.000Z' })
  updatedAt: Date | string;
}

export class PaginatedUserView {
  @ApiProperty({ type: [UserView] })
  data: UserView[];

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
