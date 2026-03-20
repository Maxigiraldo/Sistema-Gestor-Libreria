import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ShippingType } from '../shipping.entity';

export class CreateShippingDto {
  @IsNumber()
  orderId: number;

  @IsEnum(ShippingType)
  type: ShippingType;

  @IsString()
  @IsOptional()
  destinationAddress: string;
}