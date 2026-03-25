import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  filters = {
    genre: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
  };

  genres = [
    'Realismo mágico', 'Novela', 'Ciencia ficción',
    'Historia', 'Filosofía', 'Poesía', 'Terror'
  ];

  clearFilters() {
    this.filters = { genre: '', condition: '', minPrice: '', maxPrice: '' };
  }
}
