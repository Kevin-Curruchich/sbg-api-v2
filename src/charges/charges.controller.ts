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
import { CreateForStudentChargeDto } from './dto/create-charge-for-student.dto';
import { StudentChargesQueryDto } from './dto/student-charges-query.dto';
import { GetChargesCreated } from './dto/get-charges-created.dto';
import { UpdateStudentChargeDto } from './dto/update-student-charge.dto';

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

  @Get('apply/student/:studentId')
  getChargesApplyToStudent(@Param('studentId') studentId: string) {
    return this.chargesService.getChargesApplyToStudent(studentId);
  }

  @Get('student/:studentId/outstanding')
  getStudentOutstanding(@Param('studentId') studentId: string) {
    return this.chargesService.getStudentOutstanding(studentId);
  }

  @Get('student/:studentId')
  getChargesByStudentId(
    @Param('studentId') studentId: string,
    @Query() chargesQuery: StudentChargesQueryDto,
  ) {
    return this.chargesService.getChargesByStudentId(studentId, chargesQuery);
  }

  @Get()
  findAll(@Query() query: GetChargesCreated) {
    return this.chargesService.getAllCharges(query);
  }

  @Get('program')
  getChargeTypesByProgramId(@Query('programId') programId: string) {
    return this.chargesService.getChargeTypesByProgramId(programId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chargesService.getStudentChargeById(id);
  }

  @Patch(':id')
  update(
    @Param('id') chargeId: string,
    @Body() updateChargeDto: UpdateStudentChargeDto,
  ) {
    return this.chargesService.updateChargeStudent(chargeId, updateChargeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chargesService.remove(+id);
  }
}
