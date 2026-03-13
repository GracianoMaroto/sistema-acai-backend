import { Controller, Get, Param, Delete } from '@nestjs/common';
import { SaleChannelsService } from './sale-channels.service';

@Controller('sale-channels')
export class SaleChannelsController {
  constructor(private readonly saleChannelsService: SaleChannelsService) {}

  @Get()
  findAll() {
    return this.saleChannelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.saleChannelsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.saleChannelsService.remove(+id);
  }
}
