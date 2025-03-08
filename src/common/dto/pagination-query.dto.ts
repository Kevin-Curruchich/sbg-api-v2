import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDTO {
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  take: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page: number = 1;
}
