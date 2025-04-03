import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaModule } from 'src/prisma/prisma.module';
import { StudentsModule } from 'src/students/students.module';
import { ChargesModule } from 'src/charges/charges.module';

import { CommonModule } from '../common/common.module';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    StudentsModule,
    CommonModule,
    ChargesModule,
    AuthModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, ConfigService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
