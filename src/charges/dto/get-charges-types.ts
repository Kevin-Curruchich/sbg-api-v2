import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDTO } from 'src/common/dto/pagination-query.dto';

export class GetChargesTypes extends PaginationQueryDTO {
  @IsOptional()
  @IsString()
  search_query?: string;
}
