import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './book.entity';
import { Exemplar } from '../exemplars/exemplar.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    @InjectRepository(Exemplar)
    private exemplarRepository: Repository<Exemplar>,
  ) {}

  async create(createBookDto: CreateBookDto) {
    const { quantity, ...bookData } = createBookDto;

    // Crear el libro
    const book = this.bookRepository.create(bookData);
    const savedBook = await this.bookRepository.save(book);

    // Crear N ejemplares con código único
    const exemplars: Exemplar[] = [];
    for (let i = 0; i < quantity; i++) {
      const exemplar = this.exemplarRepository.create({
        uniqueCode: `LIB-${savedBook.id}-${uuidv4().substring(0, 8).toUpperCase()}`,
        book: savedBook,
        storeLocation: 'Sede Principal Pereira',
        available: true,
        outOfStock: false,
      });
      exemplars.push(exemplar);
    }
    await this.exemplarRepository.save(exemplars);

    return {
      message: 'Libro registrado exitosamente',
      book: savedBook,
      exemplarsCreated: quantity,
    };
  }

  async findAll() {
    return this.bookRepository.find({
      where: { active: true },
      relations: ['exemplars'],
    });
  }

  async findOne(id: number) {
    const book = await this.bookRepository.findOne({
      where: { id },
      relations: ['exemplars'],
    });
    if (!book) throw new NotFoundException('Libro no encontrado');
    return book;
  }

  async update(id: number, updateData: Partial<CreateBookDto>) {
    const book = await this.findOne(id);
    Object.assign(book, updateData);
    return this.bookRepository.save(book);
  }

  async remove(id: number) {
    const book = await this.findOne(id);
    book.active = false;
    await this.bookRepository.save(book);
    return { message: 'Libro eliminado exitosamente' };
  }

  async adjustStock(id: number, delta: number) {
    if (!Number.isInteger(delta) || delta === 0) {
      throw new BadRequestException('El delta debe ser un entero diferente de cero');
    }
    const book = await this.findOne(id);

    if (delta > 0) {
      const newExemplars: Exemplar[] = [];
      for (let i = 0; i < delta; i++) {
        newExemplars.push(
          this.exemplarRepository.create({
            uniqueCode: `LIB-${book.id}-${uuidv4().substring(0, 8).toUpperCase()}`,
            book,
            storeLocation: 'Sede Principal Pereira',
            available: true,
            outOfStock: false,
          }),
        );
      }
      await this.exemplarRepository.save(newExemplars);
    } else {
      const toRemove = Math.abs(delta);
      const available = book.exemplars.filter((e) => e.available && !e.outOfStock);
      if (available.length < toRemove) {
        throw new BadRequestException(
          `Solo hay ${available.length} ejemplar(es) disponibles para retirar`,
        );
      }
      const targets = available.slice(0, toRemove);
      for (const e of targets) {
        e.available = false;
        e.outOfStock = true;
      }
      await this.exemplarRepository.save(targets);
    }

    return this.findOne(id);
  }
}
