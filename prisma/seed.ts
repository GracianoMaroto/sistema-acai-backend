import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL não está definida. Verifique o arquivo .env.',
    );
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const prisma: PrismaClient = new PrismaClient({
    adapter: new PrismaPg(pool),
  });
  try {
    console.log('🌱 Seed iniciado...');

    // ROLES
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN' },
    });

    const sellerRole = await prisma.role.upsert({
      where: { name: 'SELLER' },
      update: {},
      create: { name: 'SELLER' },
    });

    // USERS
    const password = await bcrypt.hash('123456', 10);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@acai.com' },
      update: {},
      create: {
        name: 'Admin',
        email: 'admin@acai.com',
        passwordHash: password,
        roleId: adminRole.id,
      },
    });

    const sellerUser = await prisma.user.upsert({
      where: { email: 'seller@acai.com' },
      update: {},
      create: {
        name: 'Seller',
        email: 'seller@acai.com',
        passwordHash: password,
        roleId: sellerRole.id,
      },
    });
    const orderStatusNames = ['PENDING', 'IN_COURSE', 'FINALIZED', 'CANCELED'];
    const paymentStatusNames = ['PENDING', 'PARCIAL', 'PAID'];
    const deliveryStatusNames = ['PENDING', 'IN_COURSE', 'FINALIZED'];
    const paymentMethods = ['CASH', 'CREDIT', 'DEBIT', 'PIX', 'IFOOD'];

    for (const name of orderStatusNames)
      await prisma.orderStatus.upsert({
        where: { name },
        update: {},
        create: { name },
      });

    for (const name of paymentStatusNames)
      await prisma.paymentStatus.upsert({
        where: { name },
        update: {},
        create: { name },
      });

    for (const name of deliveryStatusNames)
      await prisma.deliveryStatus.upsert({
        where: { name },
        update: {},
        create: { name },
      });

    for (const name of paymentMethods)
      await prisma.paymentMethod.upsert({
        where: { name },
        update: {},
        create: { name },
      });

    // STATUS
    const pendingStatus = await prisma.orderStatus.findUnique({
      where: { name: 'PENDING' },
    });
    const inCourseStatus = await prisma.orderStatus.findUnique({
      where: { name: 'IN_COURSE' },
    });
    const finalizedStatus = await prisma.orderStatus.findUnique({
      where: { name: 'FINALIZED' },
    });
    const canceledStatus = await prisma.orderStatus.findUnique({
      where: { name: 'CANCELED' },
    });

    const paymentPending = await prisma.paymentStatus.findUnique({
      where: { name: 'PENDING' },
    });
    const paymentPaid = await prisma.paymentStatus.findUnique({
      where: { name: 'PAID' },
    });

    const pixPayment = await prisma.paymentMethod.findUnique({
      where: { name: 'PIX' },
    });
    const cashPayment = await prisma.paymentMethod.findUnique({
      where: { name: 'CASH' },
    });
    const creditPayment = await prisma.paymentMethod.findUnique({
      where: { name: 'CREDIT' },
    });
    const debitPayment = await prisma.paymentMethod.findUnique({
      where: { name: 'DEBIT' },
    });
    const ifoodPayment = await prisma.paymentMethod.findUnique({
      where: { name: 'IFOOD' },
    });
    if (
      !creditPayment ||
      !debitPayment ||
      !ifoodPayment ||
      !pixPayment ||
      !cashPayment
    ) {
      throw new Error('Algum PaymentMethod não foi encontrado no seed.');
    }

    const deliveryPending = await prisma.deliveryStatus.findUnique({
      where: { name: 'PENDING' },
    });
    const deliveryInCourse = await prisma.deliveryStatus.findUnique({
      where: { name: 'IN_COURSE' },
    });
    const deliveryFinalized = await prisma.deliveryStatus.findUnique({
      where: { name: 'FINALIZED' },
    });

    // Clientes
    const cliente1 = await prisma.customer.upsert({
      where: { email: 'joao@email.com' },
      update: {},
      create: {
        name: 'João Silva',
        phone: '11999999999',
        email: 'joao@email.com',
        street: 'Rua A',
        number: '123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000000',
      },
    });

    const cliente2 = await prisma.customer.upsert({
      where: { email: 'maria@email.com' },
      update: {},
      create: {
        name: 'Maria Souza',
        phone: '11988888888',
        email: 'maria@email.com',
        street: 'Rua B',
        number: '456',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '02000000',
      },
    });

    // Sales Channels
    const street = await prisma.saleChannel.upsert({
      where: { name: 'Street' },
      update: {},
      create: {
        name: 'Street',
        modifierType: 'DISCOUNT',
        priceModifier: new Prisma.Decimal(0),
      },
    });

    const horto = await prisma.saleChannel.upsert({
      where: { name: 'Horto' },
      update: {},
      create: {
        name: 'Horto',
        modifierType: 'DISCOUNT',
        priceModifier: new Prisma.Decimal(0),
      },
    });

    const ifood = await prisma.saleChannel.upsert({
      where: { name: 'Ifood' },
      update: {},
      create: {
        name: 'Ifood',
        modifierType: 'MARKUP',
        priceModifier: new Prisma.Decimal(10), // 10% de markup
      },
    });

    const instagram = await prisma.saleChannel.upsert({
      where: { name: 'Instagram' },
      update: {},
      create: {
        name: 'Instagram',
        modifierType: 'DISCOUNT',
        priceModifier: new Prisma.Decimal(0),
      },
    });

    const whatsapp = await prisma.saleChannel.upsert({
      where: { name: 'WhatsApp' },
      update: {},
      create: {
        name: 'WhatsApp',
        modifierType: 'DISCOUNT',
        priceModifier: new Prisma.Decimal(0),
      },
    });

    // PRODUTO AÇAÍ
    const acai = await prisma.product.create({
      data: {
        name: 'Açaí na Garrafa 300ml',
        description: 'Açaí da Bahia batido com leite e leite condensado.',
        basePrice: new Prisma.Decimal(20),
        costPrice: new Prisma.Decimal(7.5),
      },
    });

    const tradicional = await prisma.productVariant.create({
      data: { name: 'Tradicional', stockQuantity: 16, productId: acai.id },
    });

    const maracuja = await prisma.productVariant.create({
      data: { name: 'Maracujá', stockQuantity: 16, productId: acai.id },
    });

    const morango = await prisma.productVariant.create({
      data: { name: 'Morango', stockQuantity: 16, productId: acai.id },
    });

    const variants = [tradicional, maracuja, morango];

    for (const variant of variants) {
      await prisma.stockMovement.create({
        data: {
          type: 'IN',
          quantity: 16,
          productVariantId: variant.id,
          reason: 'Estoque inicial',
        },
      });
    }
    // PREÇOS AÇAÍ
    const prices = [
      { variant: tradicional, rua: [20, 7.5], ifood: [21.9, 13.3] },
      { variant: maracuja, rua: [23, 8.91], ifood: [23.9, 15.2] },
      { variant: morango, rua: [23, 9.47], ifood: [24.9, 16] },
    ];
    const channels = [street, horto, instagram, whatsapp];

    for (const item of prices) {
      // Preços iguais para todos os canais (exceto iFood)
      for (const channel of channels) {
        await prisma.productPrice.create({
          data: {
            productVariantId: item.variant.id,
            saleChannelId: channel.id,
            price: new Prisma.Decimal(item.rua[0]),
            cost: new Prisma.Decimal(item.rua[1]),
          },
        });
      }

      // Preço específico do iFood
      await prisma.productPrice.create({
        data: {
          productVariantId: item.variant.id,
          saleChannelId: ifood.id,
          price: new Prisma.Decimal(item.ifood[0]),
          cost: new Prisma.Decimal(item.ifood[1]),
        },
      });
    }
    // Orders
    const orderPending = await prisma.order.create({
      data: {
        totalAmount: new Prisma.Decimal(40),
        totalCost: new Prisma.Decimal(15),
        totalProfit: new Prisma.Decimal(25),
        sellerId: adminUser.id,
        customerId: cliente1.id,
        orderStatusId: pendingStatus.id,
        paymentStatusId: paymentPending.id,
        deliveryStatusId: deliveryPending.id,
        saleChannelId: street.id,
      },
    });
    await prisma.orderItem.create({
      data: {
        orderId: orderPending.id,
        productVariantId: tradicional.id,
        quantity: 2,
        unitPrice: new Prisma.Decimal(20),
        unitCost: new Prisma.Decimal(7.5),
      },
    });
    await prisma.stockMovement.create({
      data: {
        type: 'OUT',
        quantity: 2,
        productVariantId: tradicional.id,
        orderId: orderPending.id,
        reason: 'Venda',
      },
    });
    await prisma.productVariant.update({
      where: { id: tradicional.id },
      data: {
        stockQuantity: { decrement: 2 },
      },
    });
    const orderInCourse = await prisma.order.create({
      data: {
        totalAmount: new Prisma.Decimal(48),
        totalCost: new Prisma.Decimal(20),
        totalProfit: new Prisma.Decimal(28),
        sellerId: adminUser.id,
        customerId: cliente2.id,
        orderStatusId: inCourseStatus.id,
        paymentStatusId: paymentPending.id,
        deliveryStatusId: deliveryInCourse.id,
        saleChannelId: ifood.id,
      },
    });
    await prisma.payment.create({
      data: {
        amount: new Prisma.Decimal(30),
        orderId: orderInCourse.id,
        paymentMethodId: cashPayment.id,
      },
    });
    const orderFinalized = await prisma.order.create({
      data: {
        totalAmount: new Prisma.Decimal(70),
        totalCost: new Prisma.Decimal(30),
        totalProfit: new Prisma.Decimal(40),
        sellerId: sellerUser.id,
        customerId: cliente1.id,
        orderStatusId: finalizedStatus.id,
        paymentStatusId: paymentPaid.id,
        deliveryStatusId: deliveryFinalized.id,
        saleChannelId: whatsapp.id,
      },
    });
    await prisma.order.create({
      data: {
        totalAmount: new Prisma.Decimal(50),
        totalCost: new Prisma.Decimal(20),
        totalProfit: new Prisma.Decimal(30),
        sellerId: sellerUser.id,
        customerId: cliente2.id,
        orderStatusId: canceledStatus.id,
        paymentStatusId: paymentPending.id,
        deliveryStatusId: deliveryPending.id,
        saleChannelId: instagram.id,
      },
    });
    // Payment
    await prisma.payment.create({
      data: {
        amount: new Prisma.Decimal(70),
        orderId: orderFinalized.id,
        paymentMethodId: pixPayment.id,
      },
    });
    await prisma.payment.create({
      data: {
        amount: new Prisma.Decimal(40),
        orderId: orderPending.id,
        paymentMethodId: creditPayment.id,
      },
    });
    await prisma.payment.create({
      data: {
        amount: new Prisma.Decimal(18),
        orderId: orderInCourse.id,
        paymentMethodId: debitPayment.id,
      },
    });
    await prisma.payment.create({
      data: {
        amount: new Prisma.Decimal(30),
        orderId: orderInCourse.id,
        paymentMethodId: ifoodPayment.id,
      },
    });

    console.log('✅ Seed finalizado com sucesso!');
  } catch (e) {
    console.error('Erro durante o seeding:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
