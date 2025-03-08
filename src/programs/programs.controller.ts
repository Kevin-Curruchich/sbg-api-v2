import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  createProgram(@Body() createProgramDto: CreateProgramDto) {
    return this.programsService.createProgram(createProgramDto);
  }

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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProgramDto: UpdateProgramDto) {
    return this.programsService.updateProgramById(+id, updateProgramDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.programsService.removeProgramById(+id);
  }
}
