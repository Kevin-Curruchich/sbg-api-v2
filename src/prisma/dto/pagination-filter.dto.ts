import { Type } from 'class-transformer';
import { IsNotEmpty, IsPositive, IsInt, Min, Max } from 'class-validator';

export class PaginationFilterDto {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  page: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  take: number;
}

export class CursorPaginationFilterDto {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  limit: number;

  @Type(() => Number)
  start?: number;

  @Type(() => String)
  cursor?: string;
}
