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
        basePrice: new Prisma.Decimal(dto.basePrice),
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
        name: dto.name,
        description: dto.description,
        basePrice: dto.basePrice
          ? new Prisma.Decimal(dto.basePrice)
          : undefined,
        costPrice: dto.costPrice
          ? new Prisma.Decimal(dto.costPrice)
          : undefined,
        active: dto.active,
      },
    });
  }

  async getMetrics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const last30Days = new Date();
    last30Days.setDate(now.getDate() - 30);

    const [
      revenueMonth,
      profitMonth,
      totalOrders,
      topProduct,
      topCustomer,
      salesLast30Days,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          orderDate: {
            gte: startOfMonth,
          },
        },
      }),

      this.prisma.order.aggregate({
        _sum: {
          totalProfit: true,
        },
        where: {
          orderDate: {
            gte: startOfMonth,
          },
        },
      }),

      this.prisma.order.count({
        where: {
          orderDate: {
            gte: startOfMonth,
          },
        },
      }),

      this.prisma.orderItem.groupBy({
        by: ['productVariantId'],
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 1,
      }),

      this.prisma.order.groupBy({
        by: ['customerId'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 1,
      }),

      this.prisma.order.findMany({
        where: {
          orderDate: {
            gte: last30Days,
          },
        },
        select: {
          orderDate: true,
          totalAmount: true,
        },
        orderBy: {
          orderDate: 'asc',
        },
      }),
    ]);

    const totalRevenue = Number(revenueMonth._sum.totalAmount || 0);
    const totalProfit = Number(profitMonth._sum.totalProfit || 0);

    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    let topProductData = null;

    if (topProduct.length > 0) {
      topProductData = await this.prisma.productVariant.findUnique({
        where: {
          id: topProduct[0].productVariantId,
        },
        include: {
          product: true,
        },
      });
    }

    let topCustomerData = null;

    if (topCustomer.length > 0 && topCustomer[0].customerId) {
      topCustomerData = await this.prisma.customer.findUnique({
        where: {
          id: topCustomer[0].customerId,
        },
      });
    }

    return {
      revenueMonth: totalRevenue,
      profitMonth: totalProfit,
      totalOrders,
      averageTicket,
      topProduct: topProductData,
      topCustomer: topCustomerData,
      salesLast30Days,
    };
  }

  async remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
