import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BooksService, Book } from '../../../../core/services/books';
import { environment } from '../../../../../environments/environment';

export const BOOK_GENRES = [
  'Ficción', 'No ficción', 'Ciencia ficción', 'Fantasía', 'Terror',
  'Romance', 'Thriller', 'Misterio', 'Historia', 'Biografía',
  'Ciencia', 'Tecnología', 'Filosofía', 'Psicología', 'Economía',
  'Derecho', 'Arte', 'Poesía', 'Infantil', 'Juvenil',
  'Cómics', 'Religión', 'Política', 'Autoayuda', 'Otro'
];

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-form.html',
  styleUrl: './book-form.scss'
})
export class BookFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @Input() book: Book | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form: any = {
    title: '', author: '', publicationYear: null, genre: '',
    pages: null, publisher: '', issn: '', language: 'Español',
    publicationDate: '', condition: 'new', price: null,
    quantity: 1, coverImage: ''
  };

  genres = BOOK_GENRES;

  searchQuery = '';
  searchResults: any[] = [];
  searching = false;
  searchError = '';
  filledFromSearch = false;

  additionalQuantity = 0;

  loading = false;
  error = '';
  isEditing = false;
  formSubmitted = false;

  get infoReadonly(): boolean {
    return this.isEditing || this.filledFromSearch;
  }

  private langMap: Record<string, string> = {
    es: 'Español', en: 'Inglés', fr: 'Francés', de: 'Alemán',
    it: 'Italiano', pt: 'Portugués', zh: 'Chino', ja: 'Japonés',
    ru: 'Ruso', ar: 'Árabe'
  };

  private genreMap: Record<string, string> = {
    'fiction': 'Ficción',
    'nonfiction': 'No ficción',
    'non-fiction': 'No ficción',
    'general': 'No ficción',
    'science fiction': 'Ciencia ficción',
    'sci-fi': 'Ciencia ficción',
    'fantasy': 'Fantasía',
    'horror': 'Terror',
    'romance': 'Romance',
    'thriller': 'Thriller',
    'suspense': 'Thriller',
    'mystery': 'Misterio',
    'detective': 'Misterio',
    'crime': 'Misterio',
    'history': 'Historia',
    'historical': 'Historia',
    'biography': 'Biografía',
    'autobiography': 'Biografía',
    'biography & autobiography': 'Biografía',
    'memoir': 'Biografía',
    'science': 'Ciencia',
    'nature': 'Ciencia',
    'technology': 'Tecnología',
    'computers': 'Tecnología',
    'engineering': 'Tecnología',
    'philosophy': 'Filosofía',
    'psychology': 'Psicología',
    'self-help': 'Autoayuda',
    'personal development': 'Autoayuda',
    'economics': 'Economía',
    'business': 'Economía',
    'finance': 'Economía',
    'law': 'Derecho',
    'legal': 'Derecho',
    'art': 'Arte',
    'music': 'Arte',
    'photography': 'Arte',
    'architecture': 'Arte',
    'poetry': 'Poesía',
    'drama': 'Poesía',
    'juvenile fiction': 'Juvenil',
    'juvenile nonfiction': 'Juvenil',
    'young adult': 'Juvenil',
    "children's": 'Infantil',
    'comics': 'Cómics',
    'comic books': 'Cómics',
    'graphic novels': 'Cómics',
    'manga': 'Cómics',
    'religion': 'Religión',
    'spirituality': 'Religión',
    'bibles': 'Religión',
    'political science': 'Política',
    'politics': 'Política',
    'social science': 'Política',
  };

  private mapGenre(raw: string): string {
    if (!raw) return 'Otro';
    const key = raw.toLowerCase().trim();
    if (this.genreMap[key]) return this.genreMap[key];
    for (const [k, v] of Object.entries(this.genreMap)) {
      if (key.includes(k) || k.includes(key)) return v;
    }
    return 'Otro';
  }

  constructor(
    private booksService: BooksService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

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
        price: parseFloat(this.book.price as any),
        quantity: 1,
        coverImage: this.book.coverImage ?? ''
      };
      this.additionalQuantity = 0;
    }
  }

  get currentExemplarCount(): number {
    return this.book?.exemplars?.length ?? 0;
  }

  searchBooks() {
    if (!this.searchQuery.trim()) return;
    this.searching = true;
    this.searchResults = [];
    this.searchError = '';
    const q = encodeURIComponent(this.searchQuery.trim());
    const key = environment.googleBooksApiKey;
    const keyParam = key ? `&key=${key}` : '';
    this.http
      .get<any>(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=6${keyParam}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.searchResults = res.items ?? [];
          if (this.searchResults.length === 0) this.searchError = 'No se encontraron resultados.';
          this.searching = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.searching = false;
          if (err.status === 429 || err.error?.error?.status === 'RESOURCE_EXHAUSTED') {
            this.searchError = 'Cuota de Google Books agotada por hoy. Ingresa los datos manualmente.';
          } else {
            this.searchError = 'No se pudo conectar con Google Books. Ingresa los datos manualmente.';
          }
          this.cdr.detectChanges();
        }
      });
  }

  fillFromResult(item: any) {
    const v = item.volumeInfo;
    const rawDate: string = v.publishedDate ?? '';
    let fullDate = '';
    if (rawDate.length === 4) fullDate = `${rawDate}-01-01`;
    else if (rawDate.length === 7) fullDate = `${rawDate}-01`;
    else fullDate = rawDate;

    const cover = (v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? '')
      .replace('http://', 'https://');

    this.form.title           = v.title ?? '';
    this.form.author          = v.authors?.join(', ') ?? '';
    this.form.genre           = this.mapGenre(v.categories?.[0] ?? '');
    this.form.publisher       = v.publisher ?? '';
    this.form.publicationYear = rawDate ? parseInt(rawDate, 10) : null;
    this.form.publicationDate = fullDate;
    this.form.pages           = v.pageCount ?? null;
    this.form.language        = this.langMap[v.language] ?? v.language ?? 'Español';
    this.form.coverImage      = cover;

    this.filledFromSearch = true;
    this.searchResults = [];
    this.searchQuery = '';
    this.cdr.detectChanges();
  }

  clearSearch() {
    this.filledFromSearch = false;
    this.form = {
      title: '', author: '', publicationYear: null, genre: '',
      pages: null, publisher: '', issn: '', language: 'Español',
      publicationDate: '', condition: this.form.condition,
      price: this.form.price, quantity: this.form.quantity, coverImage: ''
    };
    this.cdr.detectChanges();
  }

  // Bloquea teclas que no tienen sentido en campos enteros (e, punto, signo)
  blockNonNumeric(event: KeyboardEvent) {
    if (['-', '+', 'e', 'E', '.'].includes(event.key)) event.preventDefault();
  }

  isFormValid(): boolean {
    const price = Number(this.form.price);
    const year = this.form.publicationYear;
    const currentYear = new Date().getFullYear();
    if (year !== null && year !== undefined && (year < 1000 || year > currentYear + 5)) return false;
    const pages = this.form.pages;
    if (pages !== null && pages !== undefined && pages < 1) return false;
    return (
      !!this.form.title?.trim() &&
      !!this.form.author?.trim() &&
      !!this.form.genre?.trim() &&
      !isNaN(price) && price >= 1000 &&
      !!this.form.condition &&
      (this.isEditing || (Number.isInteger(Number(this.form.quantity)) && Number(this.form.quantity) >= 1))
    );
  }

  onSubmit() {
    this.formSubmitted = true;
    if (!this.isFormValid()) {
      this.error = 'Completa los campos obligatorios correctamente.';
      this.cdr.detectChanges();
      return;
    }
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    const request = this.isEditing
      ? this.booksService.update(this.book!.id, {
          condition: this.form.condition,
          price: String(this.form.price),
        })
      : this.booksService.create(this.form);

    request
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const bookId = this.isEditing ? this.book!.id : res?.book?.id;
          if (this.isEditing && this.additionalQuantity > 0 && bookId) {
            this.booksService.adjustStock(bookId, this.additionalQuantity)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => { this.loading = false; this.saved.emit(); },
                error: (err) => {
                  this.error = err.error?.message ?? 'Error al ajustar ejemplares';
                  this.loading = false;
                  this.cdr.detectChanges();
                }
              });
          } else {
            this.loading = false;
            this.cdr.detectChanges();
            this.saved.emit();
          }
        },
        error: (err) => {
          this.error = err.error?.message ?? 'Error al guardar el libro';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
