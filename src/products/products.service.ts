import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const channels = await tx.saleChannel.findMany();

      const product = await tx.product.create({
        data: {
          name: dto.name,
          description: dto.description,
          active: dto.active ?? true,

          variants: {
            create: dto.variants.map((variant) => {
              const basePrice = variant.prices?.[0];

              if (!basePrice) {
                throw new Error('Preço base da variante não informado');
              }

              return {
                name: variant.name,
                stockQuantity: variant.stockQuantity ?? 0,

                prices: {
                  create: channels.map((channel) => ({
                    saleChannelId: channel.id,
                    price: new Prisma.Decimal(basePrice.price),
                    cost: new Prisma.Decimal(basePrice.cost),
                  })),
                },
              };
            }),
          },
        },

        include: {
          variants: true,
        },
      });

      // cria movimentação de estoque inicial
      for (const variant of product.variants) {
        if (variant.stockQuantity > 0) {
          await tx.stockMovement.create({
            data: {
              productVariantId: variant.id,
              quantity: variant.stockQuantity,
              type: 'IN',
              reason: 'Estoque inicial do produto',
            },
          });
        }
      }

      return product;
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        variants: {
          include: {
            prices: {
              include: {
                saleChannel: true,
              },
            },
            stockMovements: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            prices: {
              include: {
                saleChannel: true,
              },
            },
            stockMovements: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
        },
        include: { variants: true },
      });

      const existingVariantIds = product.variants.map((v) => v.id);

      const incomingVariantIds = dto.variants
        .filter((v) => v.id)
        .map((v) => v.id);

      // 🔴 deletar variantes removidas
      const variantsToDelete = existingVariantIds.filter(
        (id) => !incomingVariantIds.includes(id),
      );

      if (variantsToDelete.length) {
        await tx.productPrice.deleteMany({
          where: {
            productVariantId: { in: variantsToDelete },
          },
        });

        await tx.productVariant.deleteMany({
          where: { id: { in: variantsToDelete } },
        });
      }

      // 🟢 criar ou atualizar variantes
      for (const v of dto.variants) {
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              name: v.name,
              stockQuantity: v.stockQuantity,
            },
          });

          await tx.productPrice.updateMany({
            where: { productVariantId: v.id },
            data: {
              price: v.prices[0].price,
              cost: v.prices[0].cost,
            },
          });
        } else {
          const newVariant = await tx.productVariant.create({
            data: {
              name: v.name,
              stockQuantity: v.stockQuantity,
              productId: id,
            },
          });

          await tx.productPrice.create({
            data: {
              productVariantId: newVariant.id,
              saleChannelId: (await tx.saleChannel.findFirst()).id,
              price: v.prices[0].price,
              cost: v.prices[0].cost,
            },
          });
        }
      }

      return product;
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
    return this.prisma.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: { productId: id },
      });

      for (const variant of variants) {
        if (variant.stockQuantity > 0) {
          await tx.stockMovement.create({
            data: {
              productVariantId: variant.id,
              quantity: variant.stockQuantity,
              type: 'OUT',
              reason: 'Produto desativado',
            },
          });

          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              stockQuantity: 0,
            },
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: { active: false },
      });
    });
  }
}
