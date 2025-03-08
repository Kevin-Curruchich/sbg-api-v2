import { PartialType } from '@nestjs/swagger';
import { CreateStudentPaymentDto } from './create-student-payment.dto';

export class UpdatePaymentDto extends PartialType(CreateStudentPaymentDto) {}
