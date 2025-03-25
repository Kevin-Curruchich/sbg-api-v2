import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChargesService } from 'src/charges/charges.service';
import { ChargeStatuses } from 'src/common/constants/charge-status.constant';
import { distributeChargesByAmount } from './use-cases/distribute-charges-by-amount.use-case';

@Injectable()
export class PaymentAssistantService {
  private openAi: OpenAI;
  constructor(
    private readonly configService: ConfigService,
    private readonly chargesService: ChargesService,
  ) {
    this.openAi = new OpenAI(this.configService.get('OPENAI_API_KEY'));
  }

  async distributeStudentCredit(studentId: string, amount: number) {
    const studentCharges = await this.chargesService.getChargesByStudentId(
      studentId,
      {
        charge_status_id: ChargeStatuses.PENDING,
      },
    );

    const charges = studentCharges.map((charge) => {
      const totalAmountPaid = charge['payment_details'].reduce(
        (acc, payment) => acc + Number(payment['applied_amount']),
        0,
      );

      const totalAmountDue = Number(charge['current_amount']) - totalAmountPaid;

      return {
        charge_id: charge.charge_id,
        charge_name_and_description: charge.charge_types.name,
        totalAmountDue,
      };
    });

    return distributeChargesByAmount(this.openAi, amount, charges);
  }
}
