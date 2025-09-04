import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDTO } from 'src/common/dto/pagination-query.dto';

export class GetCourseDto extends PaginationQueryDTO {
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @IsUUID()
  @IsOptional()
  program_id?: string;
}
