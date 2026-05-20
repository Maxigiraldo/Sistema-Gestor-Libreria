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
  collapsed = false;

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

  private priceSubject = new Subject<void>();

  constructor() {
    this.priceSubject.pipe(debounceTime(500)).subscribe(() => {
      this.filtersChange.emit({ ...this.filters });
    });
  }

  onSelectChange() {
    this.filtersChange.emit({ ...this.filters });
  }

  onPriceChange() {
    this.priceSubject.next();
  }

  clearFilters() {
    this.filters = { genre: '', condition: '', minPrice: '', maxPrice: '' };
    this.filtersChange.emit({ ...this.filters });
  }
}
