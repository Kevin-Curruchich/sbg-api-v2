import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDTO {
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  take: number = 10;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page: number = 1;
}
