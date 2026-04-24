import {
  IsEmail, IsString, MinLength, MaxLength,
  IsDateString, IsOptional, IsNotEmpty,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  @MinLength(3, { message: 'El usuario debe tener al menos 3 caracteres' })
  @MaxLength(30, { message: 'El usuario no puede superar 30 caracteres' })
  username!: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(100)
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'El DNI es obligatorio' })
  @MinLength(5, { message: 'DNI inválido' })
  @MaxLength(20)
  dni!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(60)
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(60)
  lastName!: string;

  @IsDateString({}, { message: 'La fecha de nacimiento debe tener formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  birthDate!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  birthPlace?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  gender?: string;
}
