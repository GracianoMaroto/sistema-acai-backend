import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        basePrice: new Prisma.Decimal(dto.price),
        costPrice: dto.costPrice
          ? new Prisma.Decimal(dto.costPrice)
          : undefined,
        active: dto.active ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        basePrice: dto.price ? new Prisma.Decimal(dto.price) : undefined,
        costPrice: dto.costPrice
          ? new Prisma.Decimal(dto.costPrice)
          : undefined,
      },
    });
  }
  async getMetrics() {
    const totalProducts = await this.prisma.product.count();

    const products = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const totalStockValue = products.reduce((acc, product) => {
      return acc + Number(product.basePrice);
    }, 0);

    const mostExpensive = await this.prisma.product.findFirst({
      orderBy: { basePrice: 'desc' },
    });

    const latestProduct = products[0] || null;

    return {
      totalProducts,
      totalStockValue,
      mostExpensive,
      latestProduct,
    };
  }

  async remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
