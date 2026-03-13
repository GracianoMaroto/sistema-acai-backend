import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Prisma } from '@prisma/client';
import { StockService } from '../stock/stock.service';
import { ProductPriceService } from '../productprice/productprice.service';
import { AddPaymentDto } from '../payment-methods/dto/create-payment.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
    private productPriceService: ProductPriceService,
  ) {}

  async create(dto: CreateOrderDto, sellerId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 🔎 Buscar status obrigatórios
      const [
        pendingOrderStatus,
        pendingPaymentStatus,
        partialPaymentStatus,
        paidPaymentStatus,
        deliveryPending,
      ] = await Promise.all([
        tx.orderStatus.findUnique({ where: { name: 'Pendente' } }),
        tx.paymentStatus.findUnique({ where: { name: 'Pendente' } }),
        tx.paymentStatus.findUnique({ where: { name: 'Parcial' } }),
        tx.paymentStatus.findUnique({ where: { name: 'Pago' } }),
        tx.deliveryStatus.findUnique({ where: { name: 'Pendente' } }),
      ]);

      // 🚨 Validação de segurança
      if (
        !pendingOrderStatus ||
        !pendingPaymentStatus ||
        !partialPaymentStatus ||
        !paidPaymentStatus ||
        !deliveryPending
      ) {
        throw new BadRequestException(
          'Status iniciais não configurados corretamente no sistema.',
        );
      }

      let totalAmount = new Prisma.Decimal(0);
      let totalCost = new Prisma.Decimal(0);
      let totalProfit = new Prisma.Decimal(0);
      const itemsData = [];

      // 🔥 Processar itens
      for (const item of dto.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.productVariantId },
        });

        if (!variant) {
          throw new NotFoundException('Produto não encontrado');
        }

        const priceData = await this.productPriceService.getPriceOrFail(
          tx,
          variant.id,
          dto.saleChannelId,
        );

        const unitPrice = priceData.price;
        const unitCost = priceData.cost;

        const subtotal = unitPrice.mul(item.quantity);
        const totalItemCost = unitCost.mul(item.quantity);
        const profit = subtotal.sub(totalItemCost);

        totalAmount = totalAmount.add(subtotal);
        totalCost = totalCost.add(totalItemCost);
        totalProfit = totalProfit.add(profit);

        itemsData.push({
          productVariantId: variant.id,
          quantity: item.quantity,
          unitPrice,
          unitCost,
        });
      }

      // 🧾 Criar pedido
      const order = await tx.order.create({
        data: {
          seller: { connect: { id: sellerId } },
          saleChannel: { connect: { id: dto.saleChannelId } },
          customer: dto.customerId
            ? { connect: { id: dto.customerId } }
            : undefined,
          orderStatus: { connect: { id: pendingOrderStatus.id } },
          paymentStatus: { connect: { id: pendingPaymentStatus.id } },
          deliveryStatus: { connect: { id: deliveryPending.id } },
          totalAmount,
          totalCost,
          totalProfit,
          items: { create: itemsData },
        },
      });

      // 💳 Criar pagamentos se existirem
      let totalPaid = new Prisma.Decimal(0);

      if (dto.payments?.length) {
        for (const payment of dto.payments) {
          const amount = new Prisma.Decimal(payment.amount);

          await tx.payment.create({
            data: {
              orderId: order.id,
              paymentMethodId: payment.paymentMethodId,
              amount,
            },
          });

          totalPaid = totalPaid.add(amount);
        }
      }

      // 🔄 Atualizar status de pagamento automaticamente
      let paymentStatusId = pendingPaymentStatus.id;

      if (totalPaid.gt(0) && totalPaid.lt(totalAmount)) {
        paymentStatusId = partialPaymentStatus.id;
      }

      if (totalPaid.gte(totalAmount)) {
        paymentStatusId = paidPaymentStatus.id;
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { paymentStatusId },
        include: {
          items: true,
          payments: true,
          orderStatus: true,
          paymentStatus: true,
        },
      });

      return updatedOrder;
    });
  }

  async startOrder(orderId: string) {
    return this.changeOrderStatus(orderId, 'Pendente', 'Em_Curso');
  }

  async confirmPayment(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payments: true },
      });

      if (!order) throw new NotFoundException('Pedido não encontrado');

      const totalPaid = order.payments.reduce(
        (sum, p) => sum.add(p.amount),
        new Prisma.Decimal(0),
      );

      if (totalPaid.lt(order.totalAmount)) {
        throw new BadRequestException('Pagamento ainda não cobre o total');
      }

      const paidStatus = await tx.paymentStatus.findUnique({
        where: { name: 'Pago' },
      });

      return tx.order.update({
        where: { id: orderId },
        data: { paymentStatusId: paidStatus.id },
      });
    });
  }

  async addPayment(orderId: string, dto: AddPaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payments: true, orderStatus: true },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado');
      }

      if (order.orderStatus.name === 'Cancelado') {
        throw new BadRequestException('Pedido cancelado');
      }

      const amount = new Prisma.Decimal(dto.amount);

      await tx.payment.create({
        data: {
          orderId,
          paymentMethodId: dto.paymentMethodId,
          amount,
        },
      });

      // 🔥 recalcular total pago
      const payments = await tx.payment.findMany({
        where: { orderId },
      });

      const totalPaid = payments.reduce(
        (sum, p) => sum.add(p.amount),
        new Prisma.Decimal(0),
      );

      const pending = await tx.paymentStatus.findUnique({
        where: { name: 'Pendente' },
      });

      const partial = await tx.paymentStatus.findUnique({
        where: { name: 'Parcial' },
      });

      const paid = await tx.paymentStatus.findUnique({
        where: { name: 'Pago' },
      });

      let paymentStatusId = pending.id;

      if (totalPaid.gt(0) && totalPaid.lt(order.totalAmount)) {
        paymentStatusId = partial.id;
      }

      if (totalPaid.gte(order.totalAmount)) {
        paymentStatusId = paid.id;
      }

      return tx.order.update({
        where: { id: orderId },
        data: { paymentStatusId },
        include: {
          payments: {
            include: { paymentMethod: true },
          },
          paymentStatus: true,
        },
      });
    });
  }

  async removePayment(orderId: string, paymentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          payments: true,
          orderStatus: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado');
      }

      if (order.orderStatus.name === 'Finalizado') {
        throw new BadRequestException(
          'Não é possível alterar pagamentos de pedido finalizado',
        );
      }

      const payment = order.payments.find((p) => p.id === paymentId);

      if (!payment) {
        throw new NotFoundException('Pagamento não encontrado');
      }

      // 🔥 Remove pagamento
      await tx.payment.delete({
        where: { id: paymentId },
      });

      // 🔥 Recalcular total pago
      const remainingPayments = await tx.payment.findMany({
        where: { orderId },
      });

      const totalPaid = remainingPayments.reduce(
        (sum, p) => sum.add(p.amount),
        new Prisma.Decimal(0),
      );

      const pending = await tx.paymentStatus.findUnique({
        where: { name: 'Pendente' },
      });

      const partial = await tx.paymentStatus.findUnique({
        where: { name: 'Parcial' },
      });

      const paid = await tx.paymentStatus.findUnique({
        where: { name: 'Pago' },
      });

      let paymentStatusId = pending.id;

      if (totalPaid.gt(0) && totalPaid.lt(order.totalAmount)) {
        paymentStatusId = partial.id;
      }

      if (totalPaid.gte(order.totalAmount)) {
        paymentStatusId = paid.id;
      }

      return tx.order.update({
        where: { id: orderId },
        data: { paymentStatusId },
        include: {
          payments: {
            include: { paymentMethod: true },
          },
          paymentStatus: true,
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

      if (!order) throw new NotFoundException('Pedido não encontrado');

      if (order.orderStatus.name !== 'Em_Curso') {
        throw new BadRequestException('Pedido precisa estar Em_Curso');
      }

      await this.stockService.validateStock(tx, order.items);

      await this.stockService.decreaseStock(tx, order.id, order.items);

      const finalizedStatus = await tx.orderStatus.findUnique({
        where: { name: 'Finalizado' },
      });

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
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, orderStatus: true },
      });

      if (!order) throw new NotFoundException('Pedido não encontrado');

      const canceledStatus = await tx.orderStatus.findUnique({
        where: { name: 'Cancelado' },
      });

      if (order.orderStatus.name === 'Finalizado') {
        // 🔁 DEVOLVE ESTOQUE
        await this.stockService.increaseStock(tx, order.id, order.items);
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          orderStatusId: canceledStatus.id,
        },
      });
    });
  }

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

      return tx.order.update({
        where: { id: orderId },
        data: { orderStatusId: nextStatus.id },
      });
    });
  }
  async findAll(user: { sub: string; role: string }) {
    const baseQuery = {
      include: {
        customer: true,
        saleChannel: true,
        orderStatus: true,
        paymentStatus: true,
        deliveryStatus: true,
        items: {
          include: {
            productVariant: true,
          },
        },
      },
    };

    if (user.role === 'ADMIN') {
      return this.prisma.order.findMany(baseQuery);
    }

    return this.prisma.order.findMany({
      where: { sellerId: user.sub },
      orderBy: { createdAt: 'desc' },
      ...baseQuery,
    });
  }
  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        seller: true,
        customer: true,
        saleChannel: true,
        orderStatus: true,
        paymentStatus: true,
        deliveryStatus: true,
        payments: {
          include: {
            paymentMethod: true,
          },
        },
        items: {
          include: {
            productVariant: true,
          },
        },
      },
    });
  }
}
