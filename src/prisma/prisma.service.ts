import { ConfigService } from '@nestjs/config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
    });

    const extendedClient = this.$extends({
      result: {
        students: {
          studentFullName: {
            needs: {
              first_name: true,
              last_name: true,
            },
            compute(student) {
              return `${student.first_name} ${student.last_name}`;
            },
          },
        },
      },
    });

    return extendedClient as any;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
