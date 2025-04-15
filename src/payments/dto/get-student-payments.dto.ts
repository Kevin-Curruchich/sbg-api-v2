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
  payment_date_start?: Date;

  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'payment_date_end is required when payment_date_start is provided',
    },
  )
  payment_date_end?: Date;
}

export class GetStudentPaymentsRepository extends GetStudentPaymentsDto {}
