import { IsNumber } from 'class-validator';

export class AddToCartDto {
  @IsNumber()
  exemplarId: number;
}
