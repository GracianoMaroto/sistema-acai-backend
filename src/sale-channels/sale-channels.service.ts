import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SaleChannelsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.saleChannel.findMany({
      orderBy: { name: 'asc' },
    });
  }
  findOne(id: number) {
    return `This action returns a #${id} saleChannel`;
  }

  remove(id: number) {
    return `This action removes a #${id} saleChannel`;
  }
}
