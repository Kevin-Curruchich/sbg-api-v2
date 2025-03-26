import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDTO } from 'src/common/dto/pagination-query.dto';

export class GetStudentPaymentsDto extends PaginationQueryDTO {
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @IsString()
  program_level_id?: string;
}
