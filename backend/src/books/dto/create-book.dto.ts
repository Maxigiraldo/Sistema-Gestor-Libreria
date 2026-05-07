import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { BookCondition } from '../book.entity';

export class CreateBookDto {
  @IsString()
  title: string;

  @IsString()
  author: string;

  @IsNumber()
  @IsOptional()
  publicationYear: number;

  @IsString()
  genre: string;

  @IsNumber()
  @IsOptional()
  pages: number;

  @IsString()
  @IsOptional()
  publisher: string;

  @IsString()
  @IsOptional()
  issn: string;

  @IsString()
  @IsOptional()
  language: string;

  @IsDateString()
  @IsOptional()
  publicationDate: string;

  @IsEnum(BookCondition)
  condition: BookCondition;

  @IsNumber()
  @Min(1000, { message: 'El precio mínimo es $1.000 COP' })
  price: number;

  @IsString()
  @IsOptional()
  coverImage: string;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'Debe haber al menos 1 ejemplar' })
  quantity: number;
}
