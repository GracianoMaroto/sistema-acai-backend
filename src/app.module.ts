import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { StockService } from './stock/stock.service';
import { OrdersService } from './orders/orders.service';
import { StockModule } from './stock/stock.module';
import { ProductsModule } from './products/products.module';
import { SaleChannelsModule } from './sale-channels/sale-channels.module';
import { ProductPriceModule } from './productprice/productprice.module';
import { ProductPriceService } from './productprice/productprice.service';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    StockModule,
    ProductsModule,
    SaleChannelsModule,
    ProductPriceModule,
    PaymentMethodsModule,
    CustomersModule,
  ],
  controllers: [AppController],
  providers: [AppService, OrdersService, StockService, ProductPriceService],
})
export class AppModule {}
