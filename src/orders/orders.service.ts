import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Prisma } from '@prisma/client';
import { StockService } from '../stock/stock.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
  ) {}

  private async changeOrderStatus(
    orderId: string,
    current: string,
    next: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { orderStatus: true },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado');
      }

      if (order.orderStatus.name !== current) {
        throw new BadRequestException(`Pedido precisa estar ${current}`);
      }

      const nextStatus = await tx.orderStatus.findUnique({
        where: { name: next },
      });
      if (!nextStatus) {
        throw new NotFoundException(`Status ${next} não encontrado`);
      }

      return tx.order.update({
        where: { id: orderId },
        data: { orderStatusId: nextStatus.id },
      });
    });
  }

  async startOrder(orderId: string) {
    return this.changeOrderStatus(orderId, 'PENDING', 'IN COURSE');
  }
  async create(dto: CreateOrderDto, sellerId: string) {
    let totalAmount = new Prisma.Decimal(0);
    let totalCost = new Prisma.Decimal(0);

    const createdStatus = await this.prisma.orderStatus.findUnique({
      where: { name: 'PENDING' },
    });

    const pendingPayment = await this.prisma.paymentStatus.findUnique({
      where: { name: 'PENDING' },
    });

    const pendingDelivery = await this.prisma.deliveryStatus.findUnique({
      where: { name: 'PENDING' },
    });

    const itemsData = await Promise.all(
      dto.items.map(async (item) => {
        const priceData = await this.prisma.productPrice.findUnique({
          where: {
            productVariantId_saleChannelId: {
              productVariantId: item.productVariantId,
              saleChannelId: dto.saleChannelId,
            },
          },
        });

        if (!priceData) {
          throw new NotFoundException(
            'Preço não encontrado para este canal de venda',
          );
        }

        const unitPrice = priceData.price;
        const unitCost = priceData.cost;

        const totalPrice = unitPrice.mul(item.quantity);
        const totalItemCost = unitCost.mul(item.quantity);

        totalAmount = totalAmount.add(totalPrice);
        totalCost = totalCost.add(totalItemCost);

        return {
          quantity: item.quantity,
          unitPrice,
          unitCost,
          totalPrice,
          totalCost: totalItemCost,
          productVariantId: item.productVariantId,
        };
      }),
    );

    return this.prisma.order.create({
      data: {
        sellerId,
        saleChannelId: dto.saleChannelId,
        customerId: dto.customerId,

        orderStatusId: createdStatus.id,
        paymentStatusId: pendingPayment.id,
        deliveryStatusId: pendingDelivery.id,

        totalAmount,
        totalCost,
        totalProfit: totalAmount.sub(totalCost),

        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });
  }

  async confirmPayment(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { paymentStatus: true },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado');
      }

      if (order.paymentStatus.name !== 'PENDING') {
        throw new BadRequestException('Pagamento já confirmado ou inválido');
      }

      const paidStatus = await tx.paymentStatus.findUnique({
        where: { name: 'PAID' },
      });

      return tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatusId: paidStatus.id,
        },
      });
    });
  }

  async finalizeOrder(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          orderStatus: true,
          paymentStatus: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado');
      }
      if (order.orderStatus.name === 'FINALIZED') {
        throw new BadRequestException('Pedido já finalizado');
      }
      if (order.orderStatus.name !== 'IN COURSE') {
        throw new BadRequestException(
          'Pedido precisa estar EM ANDAMENTO para ser finalizado',
        );
      }
      if (order.paymentStatus.name !== 'PAID') {
        throw new BadRequestException(
          'Pedido precisa estar PAGO para ser finalizado',
        );
      }
      // Buscar status FINALIZED
      const finalizedStatus = await tx.orderStatus.findUnique({
        where: { name: 'FINALIZED' },
      });

      if (!finalizedStatus) {
        throw new NotFoundException('Status FINALIZED não encontrado no banco');
      }

      // Validação e baixa de estoque
      await this.stockService.validateStock(tx, order.items);
      await this.stockService.decreaseStock(tx, order.id, order.items);

      // Atualizar status
      return tx.order.update({
        where: { id: orderId },
        data: {
          orderStatusId: finalizedStatus.id,
        },
      });
    });
  }

  async cancelOrder(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const finalizedStatus = await tx.orderStatus.findUnique({
        where: { name: 'FINALIZED' },
      });

      const canceledStatus = await tx.orderStatus.findUnique({
        where: { name: 'CANCELED' },
      });

      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado');
      }

      if (!finalizedStatus || !canceledStatus) {
        throw new NotFoundException(
          'Status necessário não encontrado no banco',
        );
      }

      if (order.orderStatusId === canceledStatus?.id) {
        throw new BadRequestException('Pedido já cancelado');
      }

      if (order.orderStatusId !== finalizedStatus?.id) {
        throw new BadRequestException(
          'Apenas pedidos finalizados podem ser cancelados',
        );
      }

      // 🔁 Devolve estoque
      await this.stockService.increaseStock(tx, order.id, order.items);

      await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatusId: canceledStatus.id,
        },
      });

      return { message: 'Pedido cancelado e estoque devolvido com sucesso' };
    });
  }

  async findAll(user: { sub: string; role: string }) {
    if (user.role === 'ADMIN') {
      return this.prisma.order.findMany({
        include: { items: true },
      });
    }

    return this.prisma.order.findMany({
      where: { sellerId: user.sub },
      include: { items: true },
    });
  }
}
