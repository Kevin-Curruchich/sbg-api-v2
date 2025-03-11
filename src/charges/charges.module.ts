import { Module } from '@nestjs/common';
import { ChargesService } from './charges.service';
import { ChargesController } from './charges.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ChargesRepository } from './charges.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ChargesController],
  providers: [ChargesService, ChargesRepository],
  exports: [ChargesService],
})
export class ChargesModule {}
