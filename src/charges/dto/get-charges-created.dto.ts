import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDTO } from 'src/common/dto/pagination-query.dto';

export class GetChargesCreated extends PaginationQueryDTO {
  @IsOptional()
  @IsString()
  search_query?: string;

  @IsOptional()
  @IsString()
  charge_type_id?: string;

  @IsOptional()
  @IsString()
  charge_status_id?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;
}

export class GetChargesCreatedRepository extends GetChargesCreated {
  due_date_start?: Date;
  due_date_end?: Date;
}
