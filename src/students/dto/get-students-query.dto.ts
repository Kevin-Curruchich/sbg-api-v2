import { IsOptional, IsString } from 'class-validator';

export class GetStudentsQueryDto {
  @IsOptional()
  @IsString()
  program_id?: string;

  @IsOptional()
  @IsString()
  student_type_id?: string;
}
