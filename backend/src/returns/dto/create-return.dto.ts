import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ReturnCause } from '../return.entity';

export class CreateReturnDto {
  @IsNumber()
  orderId: number;

  @IsEnum(ReturnCause)
  cause: ReturnCause;

  @IsString()
  @IsOptional()
  additionalDescription: string;
}