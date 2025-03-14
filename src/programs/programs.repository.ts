import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

interface ProgramsFilterOptions {
  userId?: string;
}

@Injectable()
export class ProgramsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getPrograms(options?: ProgramsFilterOptions | null) {
    const where = {};

    if (options && options?.userId) {
      where['admin_programs'] = {
        some: {
          user_id: options.userId,
        },
      };
    }

    return await this.prismaService.programs.findMany({
      where,
      include: {
        program_levels: true,
      },
    });
  }

  async getProgramLevelsByProgramId(programId: string) {
    return await this.prismaService.program_levels.findMany({
      where: {
        program_id: programId,
      },
    });
  }
}
