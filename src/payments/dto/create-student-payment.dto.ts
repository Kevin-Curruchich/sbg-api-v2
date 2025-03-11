import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateStudentPaymentDto {
  @IsString()
  student_id: string;

  @IsNumber()
  amount: number;

  @IsString()
  payment_method_id: string;

  @IsString()
  reference_number: string;

  @IsDateString()
  payment_date: Date;

  //payment details is an array of objects with charge_id and amount. Create a new class for this and add it here
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDetails)
  payment_details: PaymentDetails[];
}

export class PaymentDetails {
  @IsString()
  charge_id: string;

  @IsNumber()
  applied_amount: number;

  @IsOptional()
  @IsString()
  description: string;
}
