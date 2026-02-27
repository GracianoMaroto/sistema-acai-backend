import {
  IsUUID,
  IsOptional,
  ValidateNested,
  IsInt,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @IsUUID()
  productVariantId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsUUID()
  saleChannelId: string;

  @IsUUID()
  orderStatusId: string;

  @IsUUID()
  paymentStatusId: string;

  @IsUUID()
  deliveryStatusId: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ArrayMinSize(1)
  items: CreateOrderItemDto[];
}
