import { IsArray, IsNumber } from 'class-validator';

export class CreateReservationDto {
  @IsArray()
  @IsNumber({}, { each: true })
  exemplarIds: number[];
}