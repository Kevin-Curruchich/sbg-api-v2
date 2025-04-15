import { Module } from '@nestjs/common';
import { GeneralService } from './general.service';
import { GeneralController } from './general.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { StudentsModule } from 'src/students/students.module';
import { PaymentsModule } from 'src/payments/payments.module';
import { ChargesModule } from 'src/charges/charges.module';

@Module({
  controllers: [GeneralController],
  providers: [GeneralService],
  imports: [
    PrismaModule,
    AuthModule,
    StudentsModule,
    PaymentsModule,
    ChargesModule,
  ],
})
export class GeneralModule {}
