import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
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
export class InventoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  books: Book[] = [];
  loading = true;
  error = '';
  showForm = false;
  selectedBook: Book | null = null;
  showDeleteConfirm = false;
  bookToDelete: Book | null = null;

  constructor(
    private booksService: BooksService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    this.booksService.getAll()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => { 
          this.loading = false;
          this.cdr.detectChanges(); 
        })
      )
      .subscribe({
        next: (data) => {
          this.books = data;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = `Error ${err.status}: no se pudieron cargar los libros`;
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openCreate() {
    this.selectedBook = null;
    this.showForm = true;
  }

  openEdit(book: Book) {
    this.selectedBook = { ...book }; // copia para no mutar el original
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.selectedBook = null;
  }

  openDelete(book: Book) {
    this.bookToDelete = book;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (!this.bookToDelete) return;
    this.booksService.delete(this.bookToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showDeleteConfirm = false;
          this.bookToDelete = null;
          this.cdr.detectChanges();
          this.loadBooks();
        },
        error: () => { 
          this.error = 'Error al eliminar el libro'; 
          this.cdr.detectChanges();
        }
      });
  }

  onFormSaved() {
    this.closeForm();
    this.loadBooks();
  }

  getAvailable(book: Book): number {
    return book.exemplars?.filter(e => e.available).length ?? 0;
  }
}
