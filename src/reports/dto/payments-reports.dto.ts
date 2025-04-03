import { IsDateString, IsOptional, IsString } from 'class-validator';

export class PaymentReportsDto {
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

export class PaymentReportsRepository extends PaymentReportsDto {
  payment_date_start?: Date;
  payment_date_end?: Date;
}
