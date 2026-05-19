import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exemplar } from '../exemplars/exemplar.entity';

export enum BookCondition {
  NEW = 'new',
  USED = 'used',
}

export enum BookGenre {
  FICCION = 'Ficción',
  NO_FICCION = 'No ficción',
  CIENCIA_FICCION = 'Ciencia ficción',
  FANTASIA = 'Fantasía',
  TERROR = 'Terror',
  ROMANCE = 'Romance',
  THRILLER = 'Thriller',
  MISTERIO = 'Misterio',
  HISTORIA = 'Historia',
  BIOGRAFIA = 'Biografía',
  CIENCIA = 'Ciencia',
  TECNOLOGIA = 'Tecnología',
  FILOSOFIA = 'Filosofía',
  PSICOLOGIA = 'Psicología',
  ECONOMIA = 'Economía',
  DERECHO = 'Derecho',
  ARTE = 'Arte',
  POESIA = 'Poesía',
  INFANTIL = 'Infantil',
  JUVENIL = 'Juvenil',
  COMICS = 'Cómics',
  RELIGION = 'Religión',
  POLITICA = 'Política',
  AUTOAYUDA = 'Autoayuda',
  OTRO = 'Otro',
}

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column()
  publicationYear: number;

  @Column({ type: 'enum', enum: BookGenre })
  genre: BookGenre;

  @Column()
  pages: number;

  @Column()
  publisher: string;

  @Column({ nullable: true })
  issn: string;

  @Column()
  language: string;

  @Column({ nullable: true, type: 'date' })
  publicationDate: Date;

  @Column({
    type: 'enum',
    enum: BookCondition,
    default: BookCondition.NEW,
  })
  condition: BookCondition;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Exemplar, (exemplar) => exemplar.book)
  exemplars: Exemplar[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}