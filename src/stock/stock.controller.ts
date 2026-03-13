import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
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

  @Get('variant/:variantId')
  findByVariant(@Param('variantId') productVariantId: string) {
    return this.prisma.stockMovement.findMany({
      where: {
        productVariantId,
      },
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
    });
  }
  @Post('stock-movements')
  async createMovement(
    @Body()
    body: {
      variantId: string;
      type: 'IN' | 'OUT';
      quantity: number;
      reason?: string;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (body.type === 'IN') {
        await tx.productVariant.update({
          where: { id: body.variantId },
          data: {
            stockQuantity: {
              increment: body.quantity,
            },
          },
        });
      } else {
        const variant = await tx.productVariant.findUnique({
          where: { id: body.variantId },
        });

        if (body.type === 'OUT' && variant.stockQuantity < body.quantity) {
          throw new BadRequestException('Estoque insuficiente');
        }
        await tx.productVariant.update({
          where: { id: body.variantId },
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
          productVariantId: body.variantId,
        },
      });
    });
  }
}
