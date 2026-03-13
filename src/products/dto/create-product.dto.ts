import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreatePriceDto {
  @IsNumber()
  price: number;

  @IsNumber()
  cost: number;

  @IsOptional()
  @IsString()
  saleChannelId: string;
}

class CreateVariantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  stockQuantity?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePriceDto)
  prices?: CreatePriceDto[];
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}
