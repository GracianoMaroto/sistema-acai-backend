import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  await prisma.$connect();
  console.log('Conectado!');

  const result = await prisma.$queryRaw`SELECT 1`;
  console.log(result);
}

test();
