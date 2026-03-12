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
      where: { name: 'VENDEDOR' },
      update: {},
      create: { name: 'VENDEDOR' },
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
      where: { email: 'vendedor@acai.com' },
      update: {},
      create: {
        name: 'Vendedor',
        email: 'vendedor@acai.com',
        passwordHash: password,
        roleId: sellerRole.id,
      },
    });
    const orderStatusNames = [
      'Pendente',
      'Em_Curso',
      'Finalizado',
      'Cancelado',
    ];
    const paymentStatusNames = ['Pendente', 'Parcial', 'Pago'];
    const deliveryStatusNames = ['Pendente', 'Em_Curso', 'Finalizado'];
    const paymentMethods = ['Dinheiro', 'Crédito', 'Débito', 'Pix', 'Ifood'];

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
      where: { name: 'Pendente' },
    });
    const inCourseStatus = await prisma.orderStatus.findUnique({
      where: { name: 'Em_Curso' },
    });
    const finalizedStatus = await prisma.orderStatus.findUnique({
      where: { name: 'Finalizado' },
    });
    const canceledStatus = await prisma.orderStatus.findUnique({
      where: { name: 'Cancelado' },
    });

    const paymentPending = await prisma.paymentStatus.findUnique({
      where: { name: 'Pendente' },
    });
    const paymentPaid = await prisma.paymentStatus.findUnique({
      where: { name: 'Pago' },
    });

    const pixPayment = await prisma.paymentMethod.findUnique({
      where: { name: 'Pix' },
    });
    const cashPayment = await prisma.paymentMethod.findUnique({
      where: { name: 'Dinheiro' },
    });
    const creditPayment = await prisma.paymentMethod.findUnique({
      where: { name: 'Crédito' },
    });
    const debitPayment = await prisma.paymentMethod.findUnique({
      where: { name: 'Débito' },
    });
    const ifoodPayment = await prisma.paymentMethod.findUnique({
      where: { name: 'Ifood' },
    });
    if (
      !creditPayment ||
      !debitPayment ||
      !ifoodPayment ||
      !pixPayment ||
      !cashPayment
    ) {
      throw new Error('Algum método de pagamento não foi encontrado no seed.');
    }

    const deliveryPending = await prisma.deliveryStatus.findUnique({
      where: { name: 'Pendente' },
    });
    const deliveryInCourse = await prisma.deliveryStatus.findUnique({
      where: { name: 'Em_Curso' },
    });
    const deliveryFinalized = await prisma.deliveryStatus.findUnique({
      where: { name: 'Finalizado' },
    });

    // Clientes
    const cliente1 = await prisma.customer.upsert({
      where: { email: 'clientegenerico@email.com' },
      update: {},
      create: {
        name: 'Cliente Genérico',
        phone: '(77)99999-9999',
        email: 'clientegenerico@email.com',
        street: 'Rua A',
        number: '123',
        city: 'Vitória da Conquista',
        state: 'BA',
        zipCode: '45000-000',
      },
    });

    // Sales Channels
    const street = await prisma.saleChannel.upsert({
      where: { name: 'Street' },
      update: {},
      create: {
        name: 'Rua',
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
        priceModifier: new Prisma.Decimal(10),
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

    const nutella = await prisma.productVariant.create({
      data: { name: 'Nutella', stockQuantity: 16, productId: acai.id },
    });

    const variants = [tradicional, maracuja, morango, nutella];

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
      { variant: tradicional, street: [20, 6.69], ifood: [21.9, 13.3] },
      { variant: maracuja, street: [23, 7.25], ifood: [23.9, 15.2] },
      { variant: morango, street: [23, 8.59], ifood: [24.9, 16] },
      { variant: nutella, street: [23, 8.59], ifood: [24.9, 16] },
    ];
    const channels = [street, horto, instagram, whatsapp];

    for (const item of prices) {
      for (const channel of channels) {
        await prisma.productPrice.create({
          data: {
            productVariantId: item.variant.id,
            saleChannelId: channel.id,
            price: new Prisma.Decimal(item.street[0]),
            cost: new Prisma.Decimal(item.street[1]),
          },
        });
      }

      await prisma.productPrice.create({
        data: {
          productVariantId: item.variant.id,
          saleChannelId: ifood.id,
          price: new Prisma.Decimal(item.ifood[0]),
          cost: new Prisma.Decimal(item.ifood[1]),
        },
      });
    }
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
