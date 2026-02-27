import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';

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

    await prisma.user.upsert({
      where: { email: 'admin@acai.com' },
      update: {},
      create: {
        name: 'Admin',
        email: 'admin@acai.com',
        passwordHash: password,
        roleId: adminRole.id,
      },
    });

    await prisma.user.upsert({
      where: { email: 'seller@acai.com' },
      update: {},
      create: {
        name: 'Seller',
        email: 'seller@acai.com',
        passwordHash: password,
        roleId: sellerRole.id,
      },
    });

    // STATUS
    const orderStatusNames = ['PENDING', 'IN COURSE', 'FINALIZED', 'CANCELED'];
    const paymentStatusNames = ['PENDING', 'PARCIAL', 'PAID'];
    const deliveryStatusNames = ['PENDING', 'IN COURSE', 'FINALIZED'];
    const saleChannels = ['Street', 'Horto', 'Ifood', 'Instagram', 'WhatsApp'];
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

    for (const name of saleChannels)
      await prisma.saleChannel.upsert({
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

    const rua = await prisma.saleChannel.findUnique({
      where: { name: 'Street' },
    });
    const ifood = await prisma.saleChannel.findUnique({
      where: { name: 'Ifood' },
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

    for (const item of prices) {
      await prisma.productPrice.createMany({
        data: [
          {
            productVariantId: item.variant.id,
            saleChannelId: rua.id,
            price: new Prisma.Decimal(item.rua[0]),
            cost: new Prisma.Decimal(item.rua[1]),
          },
          {
            productVariantId: item.variant.id,
            saleChannelId: ifood.id,
            price: new Prisma.Decimal(item.ifood[0]),
            cost: new Prisma.Decimal(item.ifood[1]),
          },
        ],
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
