import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProgramsService } from './programs.service';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  getAllPrograms() {
    return this.programsService.getAllPrograms();
  }

  @Get('/levels')
  getProgramLevelByProgramId(@Query('programId') programId: string) {
    return this.programsService.getProgramLevelsByProgramId(programId);
  }

  @Get(':id')
  programById(@Param('id') id: string) {
    return this.programsService.getProgramById(id);
  }
}
