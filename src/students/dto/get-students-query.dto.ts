import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDTO } from 'src/common/dto/pagination-query.dto';

export class GetStudentsQueryDto {
  @IsOptional()
  @IsString()
  program_id?: string;

  @IsOptional()
  @IsString()
  student_type_id?: string;

  @IsOptional()
  @IsString()
  program_level_id?: string;

  @IsOptional()
  @IsString()
  student_status_id?: string;

  @IsOptional()
  @IsString()
  student_grade_status_id?: string;
}

export class GetStudentsPaginationQueryDto extends PaginationQueryDTO {
  @IsOptional()
  @IsString()
  program_id?: string;

  @IsOptional()
  @IsString()
  student_type_id?: string;

  @IsOptional()
  @IsString()
  program_level_id?: string;

  @IsOptional()
  @IsString()
  student_status_id?: string;

  @IsOptional()
  @IsString()
  student_grade_status_id?: string;
}
