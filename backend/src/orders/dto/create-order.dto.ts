import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { DeliveryType } from '../order.entity';

export class CreateOrderDto {
  @IsArray()
  @IsNumber({}, { each: true })
  exemplarIds: number[];

  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @IsString()
  @IsOptional()
  shippingAddress: string;
}