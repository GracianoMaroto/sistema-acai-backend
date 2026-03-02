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
  ],
  controllers: [AppController],
  providers: [AppService, OrdersService, StockService],
})
export class AppModule {}
