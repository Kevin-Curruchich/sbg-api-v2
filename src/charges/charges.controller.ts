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
import { ChargesService } from './charges.service';
import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';
import { CreateForStudentChargeDto } from './dto/create-charge-for-student.dto';

@Controller('charges')
export class ChargesController {
  constructor(private readonly chargesService: ChargesService) {}

  @Post()
  create(@Body() createChargeDto: CreateChargeDto) {
    return this.chargesService.create(createChargeDto);
  }

  @Post('student')
  createChargeForStudent(@Body() createChargeDto: CreateForStudentChargeDto) {
    return this.chargesService.createChargeForStudent(createChargeDto);
  }

  @Get('student/:studentId')
  getChargesByStudentId(@Param('studentId') studentId: string) {
    return this.chargesService.getChargesByStudentId(studentId);
  }

  @Get()
  findAll() {
    return this.chargesService.findAll();
  }

  @Get('program')
  getChargeTypesByProgramId(@Query('programId') programId: string) {
    return this.chargesService.getChargeTypesByProgramId(programId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chargesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChargeDto: UpdateChargeDto) {
    return this.chargesService.update(+id, updateChargeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chargesService.remove(+id);
  }
}
