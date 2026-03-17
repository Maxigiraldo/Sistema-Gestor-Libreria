import {
Controller,
Post,
Get,
Delete,
Body,
Param,
ParseIntPipe,
Request,
UseGuards,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
constructor(private readonly reservationsService: ReservationsService) {}

@Post()
create(@Body() createReservationDto: CreateReservationDto, @Request() req) {
    return this.reservationsService.create(createReservationDto, req.user.sub);
}

@Get()
findMyReservations(@Request() req) {
    return this.reservationsService.findByUser(req.user.sub);
}

@Delete(':id')
cancel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.reservationsService.cancel(id, req.user.sub);
}
}