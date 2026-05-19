import { IsEnum, IsString } from 'class-validator';
import { CardType } from '../card.entity';

export class CreateCardDto {
  @IsEnum(CardType)
  type: CardType;

  @IsString()
  gatewayToken: string;

  @IsString()
  lastDigits: string;

  @IsString()
  brand: string;

  @IsString()
  expiryDate: string;
}