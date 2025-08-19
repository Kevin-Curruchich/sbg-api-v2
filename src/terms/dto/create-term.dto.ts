import { IsDateString, IsString } from 'class-validator';

export class CreateTermDto {
  @IsString()
  term_name: string;

  @IsDateString()
  start_date: string | Date;

  @IsDateString()
  end_date: string | Date;
}
