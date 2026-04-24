import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(3, { message: 'El usuario debe tener al menos 3 caracteres' })
  @MaxLength(30)
  username?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  lastName?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  shippingAddress?: string;
}
