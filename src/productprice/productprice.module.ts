import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductPriceController } from './productprice.controller';
import { ProductPriceService } from './productprice.service';

@Module({
  controllers: [ProductPriceController],
  providers: [ProductPriceService, PrismaService],
})
export class ProductPriceModule {}
