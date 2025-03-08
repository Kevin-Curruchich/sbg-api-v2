import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';

import { CreateChargeDto } from './dto/create-charge.dto';
import { UpdateChargeDto } from './dto/update-charge.dto';

import { CreateForStudentChargeDto } from './dto/create-charge-for-student.dto';

import { ChargesRepository } from './charges.repository';
import { ChargeStatuses } from 'src/common/constants/charge-status.constant';

@Injectable()
export class ChargesService {
  constructor(private readonly chargesRepository: ChargesRepository) {}

  create(createChargeDto: CreateChargeDto) {
    return 'This action adds a new charge';
  }

  createChargeForStudent(createChargeDto: CreateForStudentChargeDto) {
    const data = {
      ...createChargeDto,
      current_amount: createChargeDto.original_amount,
      due_date: dayjs(createChargeDto.due_date).toDate(),
      charge_status_id: ChargeStatuses.PENDING,
    };

    return this.chargesRepository.createChargeForStudent(data);
  }

  findAll() {
    return `This action returns all charges`;
  }

  getChargeTypesByProgramId(programId: string) {
    return this.chargesRepository.getChargesByProgramId(programId);
  }

  getChargesByStudentId(studentId: string) {
    return this.chargesRepository.getChargesByStudentId(studentId);
  }

  findOne(id: number) {
    return `This action returns a #${id} charge`;
  }

  update(id: number, updateChargeDto: UpdateChargeDto) {
    return `This action updates a #${id} charge`;
  }

  remove(id: number) {
    return `This action removes a #${id} charge`;
  }
}
