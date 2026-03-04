import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateProductPriceDto } from './dto/update-productprice.dto';

@Injectable()
export class ProductPriceService {
  constructor(private prisma: PrismaService) {}

  async upsertPrice(dto: UpdateProductPriceDto) {
    return this.prisma.productPrice.upsert({
      where: {
        productVariantId_saleChannelId: {
          productVariantId: dto.productVariantId,
          saleChannelId: dto.saleChannelId,
        },
      },
      update: {
        price: new Prisma.Decimal(dto.price),
        cost: new Prisma.Decimal(dto.cost),
      },
      create: {
        productVariantId: dto.productVariantId,
        saleChannelId: dto.saleChannelId,
        price: new Prisma.Decimal(dto.price),
        cost: new Prisma.Decimal(dto.cost),
      },
    });
  }

  async findByVariantAndChannel(
    productVariantId: string,
    saleChannelId: string,
  ) {
    return this.prisma.productPrice.findUnique({
      where: {
        productVariantId_saleChannelId: {
          productVariantId,
          saleChannelId,
        },
      },
    });
  }

  async getPriceOrFail(
    tx: Prisma.TransactionClient,
    productVariantId: string,
    saleChannelId: string,
  ) {
    const price = await tx.productPrice.findUnique({
      where: {
        productVariantId_saleChannelId: {
          productVariantId,
          saleChannelId,
        },
      },
    });

    if (!price) {
      throw new NotFoundException(
        'Preço não encontrado para este canal de venda',
      );
    }

    const saleChannel = await tx.saleChannel.findUnique({
      where: { id: saleChannelId },
    });

    if (!saleChannel?.priceModifier || !saleChannel.modifierType) {
      return price;
    }

    const modifier = price.price.mul(saleChannel.priceModifier.div(100));

    let finalPrice = price.price;

    if (saleChannel.modifierType === 'DISCOUNT') {
      finalPrice = price.price.sub(modifier);
    }

    if (saleChannel.modifierType === 'MARKUP') {
      finalPrice = price.price.add(modifier);
    }

    return {
      ...price,
      price: finalPrice,
    };
  }
}
