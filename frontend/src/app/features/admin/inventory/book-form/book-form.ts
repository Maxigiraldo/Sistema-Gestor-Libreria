import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BooksService, Book } from '../../../../core/services/books';

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
    this.http
      .get<any>(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=6`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.searchResults = res.items ?? [];
          if (this.searchResults.length === 0) this.searchError = 'No se encontraron resultados.';
          this.searching = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.searching = false;
          this.searchError = 'No se pudo conectar con Google Books.';
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
    this.form.genre           = v.categories?.[0] ?? '';
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

  isFormValid(): boolean {
    const price = Number(this.form.price);
    return (
      !!this.form.title?.trim() &&
      !!this.form.author?.trim() &&
      !!this.form.genre?.trim() &&
      !isNaN(price) && price >= 1000 &&
      !!this.form.condition &&
      (this.isEditing || (Number.isInteger(this.form.quantity) && this.form.quantity >= 1))
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
