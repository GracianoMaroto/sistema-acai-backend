import { IsUUID, IsDecimal } from 'class-validator';

export class AddPaymentDto {
  @IsUUID()
  paymentMethodId: string;

  @IsDecimal()
  amount: string;
}
