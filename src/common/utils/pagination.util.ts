import { ApiProperty } from '@nestjs/swagger';

/** Pagination block returned with every paginated list */
export class PaginationMetaView {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

/** Wraps a page of rows with its pagination meta */
export function paginated<T>(data: T[], total: number, page: number, limit: number) {
  const meta: PaginationMetaView = { total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  return { data, meta };
}
