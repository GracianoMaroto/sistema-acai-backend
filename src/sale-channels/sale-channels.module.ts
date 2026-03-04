import { Module } from '@nestjs/common';
import { SaleChannelsService } from './sale-channels.service';
import { SaleChannelsController } from './sale-channels.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SaleChannelsController],
  providers: [SaleChannelsService, PrismaService],
})
export class SaleChannelsModule {}
