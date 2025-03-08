import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProgramsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getPrograms() {
    return await this.prismaService.programs.findMany();
  }

  async getProgramLevelsByProgramId(programId: string) {
    return await this.prismaService.program_levels.findMany({
      where: {
        program_id: programId,
      },
    });
  }
}
