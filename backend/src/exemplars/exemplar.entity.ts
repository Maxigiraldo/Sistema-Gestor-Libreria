import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Book } from '../books/book.entity';

@Entity('exemplars')
export class Exemplar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uniqueCode: string;

  @ManyToOne(() => Book, (book) => book.exemplars)
  @JoinColumn()
  book: Book;

  @Column()
  storeLocation: string;

  @Column({ default: true })
  available: boolean;

  @Column({ default: false })
  outOfStock: boolean;

  @CreateDateColumn()
  entryDate: Date;
}