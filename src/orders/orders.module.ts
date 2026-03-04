import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { StockService } from '../stock/stock.service';
import { ProductPriceService } from '../productprice/productprice.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    StockService,
    ProductPriceService,
    PaymentMethodsService,
  ],
})
export class OrdersModule {}
