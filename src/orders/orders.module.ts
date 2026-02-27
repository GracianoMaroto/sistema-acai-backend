import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { StockService } from '../stock/stock.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, StockService],
})
export class OrdersModule {}
