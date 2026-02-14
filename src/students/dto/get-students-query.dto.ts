import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDTO } from 'src/common/dto/pagination-query.dto';

export class GetStudentsQueryDto {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsUUID()
  program_id?: string;

  @IsOptional()
  @IsUUID()
  student_type_id?: string;

  @IsOptional()
  @IsUUID()
  program_level_id?: string;

  @IsOptional()
  @IsUUID()
  student_status_id?: string;

  @IsOptional()
  @IsUUID()
  student_grade_status_id?: string;
}

export class GetStudentsPaginationQueryDto extends PaginationQueryDTO {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsUUID()
  program_id?: string;

  @IsOptional()
  @IsUUID()
  student_type_id?: string;

  @IsOptional()
  @IsUUID()
  program_level_id?: string;

  @IsOptional()
  @IsUUID()
  student_status_id?: string;

  @IsOptional()
  @IsUUID()
  student_grade_status_id?: string;
}
