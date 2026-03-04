import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { ProductPriceService } from './productprice.service';
import { UpdateProductPriceDto } from './dto/update-productprice.dto';
import { PrismaService } from '../prisma/prisma.service';
@Controller('product-prices')
export class ProductPriceController {
  constructor(
    private readonly service: ProductPriceService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  upsert(@Body() dto: UpdateProductPriceDto) {
    return this.service.upsertPrice(dto);
  }

  @Get()
  findOne(
    @Query('variantId') variantId: string,
    @Query('saleChannelId') saleChannelId: string,
  ) {
    return this.service.findByVariantAndChannel(variantId, saleChannelId);
  }

  @Get('by-channel/:saleChannelId')
  async findByChannel(@Param('saleChannelId') saleChannelId: string) {
    return this.prisma.productPrice.findMany({
      where: { saleChannelId },
      include: {
        productVariant: true,
      },
    });
  }
}
