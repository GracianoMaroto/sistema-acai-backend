import {
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
  IsInt,
  Min,
  IsDecimal,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @IsUUID()
  productVariantId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

class CreatePaymentDto {
  @IsUUID()
  paymentMethodId: string;

  @IsDecimal()
  amount: string; // Decimal vem como string no Prisma
}

export class CreateOrderDto {
  @IsUUID()
  saleChannelId: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments?: CreatePaymentDto[];
}
