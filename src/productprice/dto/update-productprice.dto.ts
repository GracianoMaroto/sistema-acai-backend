import { IsUUID, IsNumber } from 'class-validator';

export class UpdateProductPriceDto {
  @IsUUID()
  productVariantId: string;

  @IsUUID()
  saleChannelId: string;

  @IsNumber()
  price: number;

  @IsNumber()
  cost: number;
}
