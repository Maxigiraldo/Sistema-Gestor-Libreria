import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { BooksService, Book } from '../../../core/services/books';
import { BookFormComponent } from './book-form/book-form';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, NavbarComponent, BookFormComponent],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss'
})
export class InventoryComponent implements OnInit {
  books: Book[] = [];
  loading = true;
  error = '';
  showForm = false;
  selectedBook: Book | null = null;
  showDeleteConfirm = false;
  bookToDelete: Book | null = null;

  constructor(private booksService: BooksService) {}

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.loading = true;
    this.booksService.getAll().subscribe({
      next: (data) => { this.books = data; this.loading = false; },
      error: () => { this.error = 'Error al cargar libros'; this.loading = false; }
    });
  }

  openCreate() {
    this.selectedBook = null;
    this.showForm = true;
  }

  openEdit(book: Book) {
    this.selectedBook = book;
    this.showForm = true;
  }

  openDelete(book: Book) {
    this.bookToDelete = book;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (!this.bookToDelete) return;
    this.booksService.delete(this.bookToDelete.id).subscribe({
      next: () => {
        this.showDeleteConfirm = false;
        this.bookToDelete = null;
        this.loadBooks();
      },
      error: () => { this.error = 'Error al eliminar el libro'; }
    });
  }

  onFormSaved() {
    this.showForm = false;
    this.selectedBook = null;
    this.loadBooks();
  }

  getAvailable(book: Book): number {
    return book.exemplars?.filter(e => e.available).length ?? 0;
  }
}
