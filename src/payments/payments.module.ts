import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StudentsModule } from 'src/students/students.module';

import { CommonModule } from '../common/common.module';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';

@Module({
  imports: [PrismaModule, StudentsModule, CommonModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository, ConfigService],
})
export class PaymentsModule {}
