import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ShippingStatus } from '../shipping.entity';

export class UpdateStatusDto {
  @IsEnum(ShippingStatus)
  status: ShippingStatus;

  @IsString()
  @IsOptional()
  observation: string;
}