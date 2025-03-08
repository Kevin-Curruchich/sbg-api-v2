import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaService } from './prisma.service';
import { PrismaCRUD } from './prisma-crud.service';

@Global()
@Module({
  providers: [PrismaService, PrismaCRUD],
  exports: [PrismaService, PrismaCRUD],
  imports: [ConfigModule],
})
export class PrismaModule {}
