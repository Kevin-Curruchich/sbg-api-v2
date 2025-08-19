import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDTO } from 'src/common/dto/pagination-query.dto';

export class GetTermsDto extends PaginationQueryDTO {
  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  term_status_id?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;
}

export class GetTermsListDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  term_status_id?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;
}
