import { IsEmail, IsString, MinLength, IsDateString, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  dni: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsDateString()
  birthDate: string;

  @IsString()
  @IsOptional()
  birthPlace: string;

  @IsString()
  @IsOptional()
  shippingAddress: string;

  @IsString()
  @IsOptional()
  gender: string;
}