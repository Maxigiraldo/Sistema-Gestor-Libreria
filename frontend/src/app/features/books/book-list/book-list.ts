import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BooksService, Book } from '../../../core/services/books';
import { GoogleBooksService, GoogleBookInfo } from '../../../core/services/google-books';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss'
})
export class BookListComponent implements OnInit {
  books: Book[] = [];
  loading = true;
  error = '';
  selectedBook: Book | null = null;
  googleCache: Record<number, GoogleBookInfo | null> = {};

  constructor(
    private booksService: BooksService,
    private googleBooks: GoogleBooksService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.booksService.getAll().subscribe({
      next: (data) => {
        this.books = data;
        this.loading = false;
        // Precargar escalonado: 1 libro cada 700ms
        data.forEach((book, i) => {
          setTimeout(() => {
            this.fetchGoogleData(book);
          }, i * 700);
        });
      },
      error: () => {
        this.error = 'No se pudieron cargar los libros';
        this.loading = false;
      }
    });
  }

  fetchGoogleData(book: Book) {
    if (book.id in this.googleCache) return;
    if (book.coverImage) {
      this.googleCache[book.id] = {
        thumbnail: book.coverImage,
        description: '',
        previewLink: ''
      };
      this.cdr.detectChanges();
      return;
    }
    this.googleCache[book.id] = null;
    this.googleBooks.search(book.title, book.author).subscribe(info => {
      this.googleCache[book.id] = info;
      this.cdr.detectChanges();
    });
  }

  getCover(book: Book): string {
    if (book.coverImage) return book.coverImage;
    return this.googleCache[book.id]?.thumbnail ?? '';
  }

  getDescription(book: Book): string {
    return this.googleCache[book.id]?.description ?? '';
  }

  getPreviewLink(book: Book): string {
    return this.googleCache[book.id]?.previewLink ?? '';
  }

  getAvailableCount(book: Book): number {
    return book.exemplars.filter(e => e.available).length;
  }

  openDetail(book: Book) {
    this.selectedBook = book;
    this.fetchGoogleData(book);
  }

  closeDetail() {
    this.selectedBook = null;
  }
}
