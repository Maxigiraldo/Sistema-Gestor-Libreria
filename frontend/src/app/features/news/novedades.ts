import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { NewsService } from '../../core/services/news';
import { BooksService } from '../../core/services/books';
import { ReservationsService } from '../../core/services/reservations';
import { GoogleBooksService, GoogleBookInfo } from '../../core/services/google-books';
import { AuthService } from '../../core/services/auth';
import { Book } from '../../core/services/books';

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './novedades.html',
  styleUrl: './novedades.scss',
})
export class NovedadesComponent implements OnInit, OnDestroy {
  subscribed = false;
  books: Book[] = [];
  loading = true;
  loadingSubscription = false;

  selectedBook: Book | null = null;
  googleCache: Record<number, GoogleBookInfo | null> = {};
  cartMessage = '';
  cartError = '';
  isAddingToCart = false;

  recommendations: Book[] = [];
  loadingRecs = false;

  private destroy$ = new Subject<void>();
  private fetchTimeouts: ReturnType<typeof setTimeout>[] = [];

  private spineColors = [
    '#7B241C','#1B4F72','#145A32','#4A235A','#784212',
    '#1A5276','#0E6655','#6E2F0A','#2E4057','#4527A0',
    '#880E4F','#1565C0','#2E7D32','#4E342E','#00695C',
  ];

  constructor(
    private newsService: NewsService,
    private booksService: BooksService,
    private reservationsService: ReservationsService,
    private googleBooks: GoogleBooksService,
    public auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (this.auth.getRole() !== 'client') {
      this.router.navigate(['/']);
      return;
    }
    this.newsService.getSubscription().pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ subscribed }) => {
        this.subscribed = subscribed;
        if (subscribed) this.loadBooks();
        else { this.loading = false; this.cdr.detectChanges(); }
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  private loadBooks() {
    this.loading = true;
    this.newsService.getNewBooks().pipe(takeUntil(this.destroy$)).subscribe({
      next: (books) => {
        this.books = books;
        this.loading = false;
        this.scheduleGoogleFetch(books);
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  toggleSubscription() {
    this.loadingSubscription = true;
    const next = !this.subscribed;
    this.newsService.setSubscription(next).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ subscribed }) => {
        this.subscribed = subscribed;
        this.loadingSubscription = false;
        if (subscribed && this.books.length === 0) {
          this.loadBooks();
        } else if (!subscribed) {
          this.books = [];
          this.loading = false;
        }
        this.cdr.detectChanges();
      },
      error: () => { this.loadingSubscription = false; this.cdr.detectChanges(); },
    });
  }

  private scheduleGoogleFetch(books: Book[]) {
    this.fetchTimeouts.forEach(t => clearTimeout(t));
    this.fetchTimeouts = [];
    books.forEach((book, i) => {
      const t = setTimeout(() => this.fetchGoogleData(book), i * 700);
      this.fetchTimeouts.push(t);
    });
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
      .subscribe(info => { this.googleCache[book.id] = info; this.cdr.detectChanges(); });
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

  getBookColor(book: Book): string {
    return this.spineColors[book.id % this.spineColors.length];
  }

  getAvailableCount(book: Book): number {
    return book.exemplars.filter(e => e.available).length;
  }

  openDetail(book: Book) {
    this.selectedBook = book;
    this.cartMessage = '';
    this.cartError = '';
    this.recommendations = [];
    this.fetchGoogleData(book);
    this.loadingRecs = true;
    this.booksService.getRecommendations(book.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (recs) => { this.recommendations = recs; this.loadingRecs = false; this.cdr.detectChanges(); },
        error: () => { this.loadingRecs = false; }
      });
  }

  closeDetail() {
    this.selectedBook = null;
    this.cartMessage = '';
    this.cartError = '';
  }

  addToCart(book: Book) {
    const exemplar = book.exemplars.find(e => e.available);
    if (!exemplar) return;
    this.isAddingToCart = true;
    this.cartMessage = '';
    this.cartError = '';
    this.reservationsService.addToCart(exemplar.id).subscribe({
      next: () => {
        this.cartMessage = 'Libro agregado al carrito. Tienes 24 horas para completar la compra.';
        exemplar.available = false;
        this.isAddingToCart = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cartError = err.error?.message ?? 'No se pudo agregar al carrito';
        this.isAddingToCart = false;
        this.cdr.detectChanges();
      },
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
      },
    });
  }

  get isClient(): boolean {
    return this.auth.getRole() === 'client';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.fetchTimeouts.forEach(t => clearTimeout(t));
  }
}
