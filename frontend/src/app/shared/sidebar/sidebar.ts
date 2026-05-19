import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface SidebarFilters {
  genre: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
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
  };

  genres = [
  'Ficción', 'No ficción', 'Ciencia ficción', 'Fantasía', 'Terror',
  'Romance', 'Thriller', 'Misterio', 'Historia', 'Biografía',
  'Ciencia', 'Tecnología', 'Filosofía', 'Psicología', 'Economía',
  'Derecho', 'Arte', 'Poesía', 'Infantil', 'Juvenil',
  'Cómics', 'Religión', 'Política', 'Autoayuda', 'Otro'
];

  // Debounce solo para los inputs de precio
  private priceSubject = new Subject<void>();

  constructor() {
    this.priceSubject.pipe(debounceTime(500)).subscribe(() => {
      this.filtersChange.emit({ ...this.filters });
    });
  }

  onSelectChange() {
    // Género y condición reaccionan inmediatamente
    this.filtersChange.emit({ ...this.filters });
  }

  onPriceChange() {
    // Precio espera 500ms tras la última tecla
    this.priceSubject.next();
  }

  clearFilters() {
    this.filters = { genre: '', condition: '', minPrice: '', maxPrice: '' };
    this.filtersChange.emit({ ...this.filters });
  }
}