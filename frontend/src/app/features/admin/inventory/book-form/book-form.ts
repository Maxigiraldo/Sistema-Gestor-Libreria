import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BooksService, Book } from '../../../../core/services/books';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-form.html',
  styleUrl: './book-form.scss'
})
export class BookFormComponent implements OnInit {
  @Input() book: Book | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form: any = {
    title: '',
    author: '',
    publicationYear: null,
    genre: '',
    pages: null,
    publisher: '',
    issn: '',
    language: 'Español',
    publicationDate: '',
    condition: 'new',
    price: null,
    quantity: 1
  };

  loading = false;
  error = '';
  isEditing = false;

  constructor(private booksService: BooksService) {}

  ngOnInit() {
    if (this.book) {
      this.isEditing = true;
      this.form = {
        title: this.book.title,
        author: this.book.author,
        publicationYear: this.book.publicationYear,
        genre: this.book.genre,
        pages: (this.book as any).pages,
        publisher: this.book.publisher,
        issn: (this.book as any).issn,
        language: this.book.language,
        publicationDate: (this.book as any).publicationDate,
        condition: this.book.condition,
        price: parseFloat(this.book.price),
        quantity: 1
      };
    }
  }

  onSubmit() {
    this.loading = true;
    this.error = '';

    const request = this.isEditing
      ? this.booksService.update(this.book!.id, this.form)
      : this.booksService.create(this.form);

    request.subscribe({
      next: () => { this.loading = false; this.saved.emit(); },
      error: (err) => {
        this.error = err.error?.message ?? 'Error al guardar el libro';
        this.loading = false;
      }
    });
  }
}
