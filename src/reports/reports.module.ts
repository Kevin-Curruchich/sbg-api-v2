import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PaymentsModule } from 'src/payments/payments.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
  imports: [PaymentsModule, AuthModule],
})
export class ReportsModule {}
