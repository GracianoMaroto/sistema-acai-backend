import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async validateStock(
    tx: Prisma.TransactionClient,
    items: { productVariantId: string; quantity: number }[],
  ) {
    const variantIds = items.map((i) => i.productVariantId);

    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds } },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    for (const item of items) {
      const variant = variantMap.get(item.productVariantId);

      if (!variant || variant.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para ${variant?.name}`,
        );
      }
    }
  }

  async decreaseStock(
    tx: Prisma.TransactionClient,
    orderId: string,
    items: { productVariantId: string; quantity: number }[],
  ) {
    for (const item of items) {
      await tx.productVariant.update({
        where: { id: item.productVariantId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          type: 'OUT',
          quantity: item.quantity,
          productVariantId: item.productVariantId,
          orderId,
          reason: 'Pedido finalizado',
        },
      });
    }
  }

  async increaseStock(
    tx: Prisma.TransactionClient,
    orderId: string,
    items: { productVariantId: string; quantity: number }[],
  ) {
    for (const item of items) {
      await tx.productVariant.update({
        where: { id: item.productVariantId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          type: 'IN',
          quantity: item.quantity,
          productVariantId: item.productVariantId,
          orderId,
          reason: 'Cancelamento de pedido',
        },
      });
    }
  }
}
