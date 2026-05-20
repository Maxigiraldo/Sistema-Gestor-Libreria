import { Component, Output, EventEmitter } from '@angular/core';
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
export class SidebarComponent {
  @Output() filtersChange = new EventEmitter<SidebarFilters>();

  filters: SidebarFilters = {
    genre: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    rating: 0,
  };

  maxPriceSlider = 500000;
  showAllGenres = false;

  sections = {
    categories: true,
    price: true,
    condition: true,
    rating: true,
  };

  readonly genres = [
    'Ficción', 'No ficción', 'Romance', 'Historia',
    'Ciencia ficción', 'Terror', 'Thriller', 'Misterio',
    'Biografía', 'Ciencia', 'Tecnología', 'Filosofía',
    'Psicología', 'Autoayuda', 'Infantil', 'Juvenil',
    'Arte', 'Poesía', 'Economía', 'Derecho',
  ];

  readonly stars = [1, 2, 3, 4, 5];

  get visibleGenres(): string[] {
    return this.showAllGenres ? this.genres : this.genres.slice(0, 6);
  }

  get hasActiveFilters(): boolean {
    return !!(this.filters.genre || this.filters.condition || this.filters.maxPrice || this.filters.rating);
  }

  toggleSection(key: keyof typeof this.sections) {
    this.sections[key] = !this.sections[key];
  }

  selectGenre(genre: string) {
    this.filters.genre = this.filters.genre === genre ? '' : genre;
  }

  setRating(r: number) {
    this.filters.rating = this.filters.rating === r ? 0 : r;
  }

  onSliderChange() {
    this.filters.maxPrice = this.maxPriceSlider < 500000 ? String(this.maxPriceSlider) : '';
  }

  applyFilters() {
    this.filtersChange.emit({ ...this.filters });
  }

  clearFilters() {
    this.filters = { genre: '', condition: '', minPrice: '', maxPrice: '', rating: 0 };
    this.maxPriceSlider = 500000;
    this.filtersChange.emit({ ...this.filters });
  }

  formatPrice(value: number): string {
    return '$' + value.toLocaleString('es-CO');
  }
}
