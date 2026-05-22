import { Component, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SidebarFilters {
  genre: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  rating: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent implements OnDestroy {
  @Output() filtersChange = new EventEmitter<SidebarFilters>();

  filters: SidebarFilters = {
    genre: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    rating: 0,
  };

  minPriceInput = '';
  maxPriceInput = '';
  maxPriceSlider = 500000;
  showAllGenres = false;

  sections = {
    categories: true,
    price: true,
    condition: true,
  };

  readonly genres = [
    'Ficción', 'No Ficción', 'Ciencia Ficción', 'Fantasía', 'Romance',
    'Misterio', 'Terror', 'Thriller', 'Historia', 'Biografía',
    'Autoayuda', 'Ciencia', 'Tecnología', 'Arte', 'Literatura Infantil',
    'Poesía', 'Filosofía', 'Economía', 'Derecho', 'Medicina',
  ];

  private debounceTimer: any = null;

  get visibleGenres(): string[] {
    return this.showAllGenres ? this.genres : this.genres.slice(0, 6);
  }

  get hasActiveFilters(): boolean {
    return !!(this.filters.genre || this.filters.condition || this.filters.minPrice || this.filters.maxPrice);
  }

  get sliderPercent(): number {
    return ((this.maxPriceSlider - 5000) / (500000 - 5000)) * 100;
  }

  toggleSection(key: keyof typeof this.sections) {
    this.sections[key] = !this.sections[key];
  }

  selectGenre(genre: string) {
    this.filters.genre = this.filters.genre === genre ? '' : genre;
    this.emit();
  }

  onConditionChange() {
    this.emit();
  }

  onSliderChange() {
    this.filters.maxPrice = this.maxPriceSlider < 500000 ? String(this.maxPriceSlider) : '';
    this.maxPriceInput = this.filters.maxPrice;
    this.debounceEmit();
  }

  onMinPriceInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/[^0-9]/g, '');
    input.value = val;
    this.minPriceInput = val;
    this.filters.minPrice = val;
    this.debounceEmit();
  }

  onMaxPriceInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/[^0-9]/g, '');
    input.value = val;
    this.maxPriceInput = val;
    this.filters.maxPrice = val;
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 5000 && num <= 500000) {
      this.maxPriceSlider = num;
    }
    this.debounceEmit();
  }

  private debounceEmit() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.emit(), 400);
  }

  private emit() {
    this.filtersChange.emit({ ...this.filters });
  }

  clearFilters() {
    this.filters = { genre: '', condition: '', minPrice: '', maxPrice: '', rating: 0 };
    this.minPriceInput = '';
    this.maxPriceInput = '';
    this.maxPriceSlider = 500000;
    this.emit();
  }

  formatPrice(value: number): string {
    return '$' + value.toLocaleString('es-CO');
  }

  ngOnDestroy() {
    clearTimeout(this.debounceTimer);
  }
}
