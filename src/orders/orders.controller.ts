import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Roles } from '../auth/guard/roles-decorator';
import { RolesGuard } from '../auth/guard/roles-guard';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateOrderDto, @Request() req) {
    return this.ordersService.create(dto, req.user.sub);
  }

  @Patch(':id/finalize')
  finalize(@Param('id') id: string) {
    return this.ordersService.finalizeOrder(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  findAll(@Request() req) {
    return this.ordersService.findAll(req.user);
  }
}
