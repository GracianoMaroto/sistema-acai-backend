import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Req,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { AddPaymentDto } from '../payment-methods/dto/create-payment.dto';

@UseGuards(JwtAuthGuard) // 🔥 aplica em tudo
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.create(dto, req.user.sub);
  }
  @Post(':id/payments')
  addPayment(@Param('id') id: string, @Body() dto: AddPaymentDto) {
    return this.ordersService.addPayment(id, dto);
  }
  @Get()
  findAll(@Request() req: any) {
    return this.ordersService.findAll(req.user);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/start')
  start(@Param('id') id: string) {
    return this.ordersService.startOrder(id);
  }
  @Patch(':id/confirm-payment')
  confirmPayment(@Param('id') id: string) {
    return this.ordersService.confirmPayment(id);
  }
  @Patch(':id/finalize')
  finalize(@Param('id') id: string) {
    return this.ordersService.finalizeOrder(id);
  }
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }
  @Delete(':orderId/payments/:paymentId')
  removePayment(
    @Param('orderId') orderId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.ordersService.removePayment(orderId, paymentId);
  }
}
