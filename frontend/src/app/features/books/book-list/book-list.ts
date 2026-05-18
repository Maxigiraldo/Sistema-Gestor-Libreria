import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, skip, takeUntil } from 'rxjs/operators';
import { BooksService, Book } from '../../../core/services/books';
import { GoogleBooksService, GoogleBookInfo } from '../../../core/services/google-books';
import { SearchService, SearchParams } from '../../../core/services/search';
import { ReservationsService } from '../../../core/services/reservations';
import { AuthService } from '../../../core/services/auth';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss'
})
export class BookListComponent implements OnInit, OnDestroy {
  books: Book[] = [];
  loading = true;
  error = '';
  selectedBook: Book | null = null;
  googleCache: Record<number, GoogleBookInfo | null> = {};

  isSearchActive = false;
  searchTotal = 0;
  private searchQuery = '';
  private searchSubject = new Subject<void>();
  private subs = new Subscription();
  private destroy$ = new Subject<void>();
  private fetchTimeouts: ReturnType<typeof setTimeout>[] = [];

  reservationMessage = '';
  reservationError = '';
  isReserving = false;

  constructor(
    private booksService: BooksService,
    private googleBooks: GoogleBooksService,
    private searchService: SearchService,
    private reservationsService: ReservationsService,
    public auth: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.searchQuery = this.searchService.getCurrentQuery();
    this.loadBooks();

    this.subs.add(
      this.searchSubject.pipe(debounceTime(350)).subscribe(() => this.loadBooks())
    );

    this.subs.add(
      this.searchService.query$.pipe(skip(1), debounceTime(400)).subscribe(q => {
        this.searchQuery = q;
        this.searchSubject.next();
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    this.fetchTimeouts.forEach(t => clearTimeout(t));
    this.fetchTimeouts = [];
  }

  private buildParams(): SearchParams {
    const p: SearchParams = {};
    if (this.searchQuery) p.title = this.searchQuery;
    return p;
  }

  private scheduleGoogleFetch(books: Book[]) {
    this.fetchTimeouts.forEach(t => clearTimeout(t));
    this.fetchTimeouts = [];
    books.forEach((book, i) => {
      const t = setTimeout(() => this.fetchGoogleData(book), i * 700);
      this.fetchTimeouts.push(t);
    });
  }

  private loadBooks() {
    this.loading = true;
    this.error = '';

    const params = this.buildParams();
    const hasFilters = Object.values(params).some(v => v);

    if (!hasFilters) {
      this.isSearchActive = false;
      this.subs.add(
        this.booksService.getAll().subscribe({
          next: (data) => {
            this.books = data;
            this.searchTotal = data.length;
            this.loading = false;
            this.scheduleGoogleFetch(data);
          },
          error: () => {
            this.error = 'No se pudieron cargar los libros';
            this.loading = false;
          }
        })
      );
    } else {
      this.isSearchActive = true;
      this.subs.add(
        this.searchService.search(params).subscribe({
          next: ({ results, total }) => {
            this.books = results;
            this.searchTotal = total;
            this.loading = false;
            this.scheduleGoogleFetch(results);
          },
          error: () => {
            this.error = 'Error al buscar libros';
            this.loading = false;
          }
        })
      );
    }
  }

  fetchGoogleData(book: Book) {
    if (book.id in this.googleCache) return;
    if (book.coverImage) {
      this.googleCache[book.id] = { thumbnail: book.coverImage, description: '', previewLink: '' };
      this.cdr.detectChanges();
      return;
    }
    this.googleCache[book.id] = null;
    this.googleBooks.search(book.title, book.author)
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => {
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

  private spineColors = [
    '#7B241C','#1B4F72','#145A32','#4A235A','#784212',
    '#1A5276','#0E6655','#6E2F0A','#2E4057','#4527A0',
    '#880E4F','#1565C0','#2E7D32','#4E342E','#00695C',
  ];

  getBookColor(book: Book): string {
    return this.spineColors[book.id % this.spineColors.length];
  }

  openDetail(book: Book) {
    this.selectedBook = book;
    this.reservationMessage = '';
    this.reservationError = '';
    this.fetchGoogleData(book);
  }

  closeDetail() {
    this.selectedBook = null;
    this.reservationMessage = '';
    this.reservationError = '';
  }

  get isClient(): boolean {
    return this.auth.getRole() === 'client';
  }

  reserveBook(book: Book) {
    const exemplar = book.exemplars.find(e => e.available);
    if (!exemplar) return;

    this.isReserving = true;
    this.reservationMessage = '';
    this.reservationError = '';

    this.reservationsService.create([exemplar.id]).subscribe({
      next: () => {
        this.reservationMessage = 'Reserva creada. Tienes 24 horas para recoger el libro.';
        exemplar.available = false;
        this.isReserving = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.reservationError = err.error?.message ?? 'No se pudo crear la reserva';
        this.isReserving = false;
      }
    });
  }

  buyBook(book: Book) {
    const exemplar = book.exemplars.find(e => e.available);
    if (!exemplar) return;
    this.router.navigate(['/checkout'], {
      state: {
        exemplarId: exemplar.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        price: Number(book.price),
      }
    });
  }
}
