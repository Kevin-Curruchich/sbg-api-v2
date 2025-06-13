import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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

  @IsOptional()
  @IsBoolean()
  is_from_credit_balance?: boolean;
}

export class CreateStudentsPaymentDto {
  @IsArray()
  student_ids: string[];

  @IsNumber()
  amount: number;

  @IsDateString()
  payment_date: Date;

  @IsString()
  @IsOptional()
  payment_description?: string;

  @IsString()
  payment_method_id: string;

  @IsString()
  reference_number: string;
}

export class CreateStudentAutomatizedPaymentDto {
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
}
