import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  // Solo administradores pueden crear, editar y eliminar libros
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ROOT)
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  // Cualquiera puede ver los libros
  @Get()
  findAll() {
    return this.booksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findOne(id);
  }

  // Solo administradores pueden editar
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ROOT)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateBookDto>,
  ) {
    return this.booksService.update(id, updateData);
  }

  // Solo administradores pueden eliminar
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ROOT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.remove(id);
  }

  @Put(':id/exemplars/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ROOT)
  adjustStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('delta') delta: number,
  ) {
    return this.booksService.adjustStock(id, delta);
  }
}