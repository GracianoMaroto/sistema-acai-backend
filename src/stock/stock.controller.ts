import { Body, Controller, Get, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
  ) {}

  @Get('stock-movements')
  async getMovements() {
    return this.prisma.stockMovement.findMany({
      include: {
        productVariant: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  }

  @Post('stock-movements')
  async createMovement(
    @Body()
    body: {
      productVariantId: string;
      type: 'IN' | 'OUT';
      quantity: number;
      reason?: string;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (body.type === 'IN') {
        await tx.productVariant.update({
          where: { id: body.productVariantId },
          data: {
            stockQuantity: {
              increment: body.quantity,
            },
          },
        });
      } else {
        await tx.productVariant.update({
          where: { id: body.productVariantId },
          data: {
            stockQuantity: {
              decrement: body.quantity,
            },
          },
        });
      }

      return tx.stockMovement.create({
        data: {
          type: body.type,
          quantity: body.quantity,
          reason: body.reason,
          productVariantId: body.productVariantId,
        },
      });
    });
  }
}
