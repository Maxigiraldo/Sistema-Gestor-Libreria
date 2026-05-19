import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ReturnCause, RefundMethod } from '../return.entity';

export class CreateReturnDto {
  @IsNumber()
  orderId: number;

  @IsEnum(ReturnCause)
  cause: ReturnCause;

  @IsString()
  @IsOptional()
  additionalDescription: string;

  @IsEnum(RefundMethod)
  refundMethod: RefundMethod;
}