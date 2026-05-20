import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { DeliveryType } from '../order.entity';

export enum CheckoutPaymentMethod {
  CARD = 'tarjeta',
  BALANCE = 'saldo',
  MIXED = 'mixto',
}

export class CreateOrderDto {
  @IsArray()
  @IsNumber({}, { each: true })
  exemplarIds: number[];

  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsEnum(CheckoutPaymentMethod)
  paymentMethod: CheckoutPaymentMethod;

  // Card data — required when method is 'tarjeta' or 'mixto' (unless using savedCardId)
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  cardHolderName?: string;

  @IsOptional()
  @IsString()
  cardExpiry?: string;

  @IsOptional()
  @IsString()
  cardCvv?: string;

  @IsOptional()
  @IsString()
  cardType?: string;

  @IsOptional()
  @IsBoolean()
  saveCard?: boolean;

  @IsOptional()
  @IsNumber()
  savedCardId?: number;

  @IsOptional()
  @IsBoolean()
  fromReservation?: boolean;
}
