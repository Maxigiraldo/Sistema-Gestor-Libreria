import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersService } from '../../../core/services/users';
import { NavbarComponent } from '../../../shared/navbar/navbar';

const ALL_GENRES = [
  'Ficción', 'No Ficción', 'Ciencia Ficción', 'Fantasía', 'Romance',
  'Misterio', 'Terror', 'Thriller', 'Historia', 'Biografía',
  'Autoayuda', 'Ciencia', 'Tecnología', 'Arte', 'Literatura Infantil',
  'Poesía', 'Filosofía', 'Economía', 'Derecho', 'Medicina',
];

@Component({
  selector: 'app-favorite-categories',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './favorite-categories.html',
  styleUrl: './favorite-categories.scss',
})
export class FavoriteCategoriesComponent implements OnInit {
  readonly allGenres = ALL_GENRES;
  selected = new Set<string>();

  loading = true;
  saving = false;
  success = '';
  error = '';

  constructor(
    private users: UsersService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.users.getCategories().subscribe({
      next: (res) => {
        this.selected = new Set(res.favoriteGenres ?? []);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  toggle(genre: string) {
    if (this.selected.has(genre)) {
      this.selected.delete(genre);
    } else {
      this.selected.add(genre);
    }
    this.selected = new Set(this.selected);
  }

  isSelected(genre: string) {
    return this.selected.has(genre);
  }

  save() {
    this.saving = true;
    this.success = '';
    this.error = '';
    this.users.updateCategories([...this.selected]).subscribe({
      next: () => {
        this.saving = false;
        this.success = 'Preferencias guardadas correctamente.';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.saving = false;
        this.error = err?.error?.message ?? 'Error al guardar las preferencias';
        this.cdr.detectChanges();
      },
    });
  }
}
