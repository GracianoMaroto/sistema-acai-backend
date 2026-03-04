import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { PaymentMethodsService } from './payment-methods.service';

@UseGuards(JwtAuthGuard)
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private paymentService: PaymentMethodsService) {}

  @Get()
  async findAll() {
    return this.paymentService.findAll();
  }
}
