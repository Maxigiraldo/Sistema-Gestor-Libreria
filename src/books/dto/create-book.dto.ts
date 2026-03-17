import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { BookCondition } from '../book.entity';

export class CreateBookDto {
  @IsString()
  title: string;

  @IsString()
  author: string;

  @IsNumber()
  publicationYear: number;

  @IsString()
  genre: string;

  @IsNumber()
  pages: number;

  @IsString()
  publisher: string;

  @IsString()
  @IsOptional()
  issn: string;

  @IsString()
  language: string;

  @IsDateString()
  @IsOptional()
  publicationDate: string;

  @IsEnum(BookCondition)
  condition: BookCondition;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  coverImage: string;

  @IsNumber()
  quantity: number;
}