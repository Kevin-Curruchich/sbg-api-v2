import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDTO } from 'src/common/dto/pagination-query.dto';

export class GetStudentPaymentsDto extends PaginationQueryDTO {
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @IsString()
  program_level_id?: string;

  @IsOptional()
  @IsDateString()
  payment_date?: string;
}

export class GetStudentPaymentsRepository extends GetStudentPaymentsDto {
  payment_date_start?: Date;
  payment_date_end?: Date;
}
