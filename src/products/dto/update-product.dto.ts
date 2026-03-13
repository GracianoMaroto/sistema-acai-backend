import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdatePriceDto {
  @IsNumber()
  price: number;

  @IsNumber()
  cost: number;
}

class UpdateVariantDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  stockQuantity?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePriceDto)
  prices: UpdatePriceDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantDto)
  variants?: UpdateVariantDto[];
}
