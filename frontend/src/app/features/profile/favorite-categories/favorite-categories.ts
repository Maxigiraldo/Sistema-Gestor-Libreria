import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersService } from '../../../core/services/users';
import { NavbarComponent } from '../../../shared/navbar/navbar';

interface GenreMeta {
  icon: string;
  desc: string;
  bg: string;
  color: string;
}

const GENRE_META: Record<string, GenreMeta> = {
  'Ficción':             { icon: '📖', desc: 'Mundos imaginarios que te llevan a otras realidades',        bg: '#fce7f3', color: '#9d174d' },
  'No Ficción':          { icon: '🔍', desc: 'Conocimiento real, hechos y aprendizaje continuo',           bg: '#dbeafe', color: '#1e40af' },
  'Ciencia Ficción':     { icon: '🚀', desc: 'Explora el futuro, el espacio y la tecnología',              bg: '#ede9fe', color: '#5b21b6' },
  'Fantasía':            { icon: '🧙', desc: 'Magia, criaturas y mundos llenos de posibilidades',          bg: '#d1fae5', color: '#065f46' },
  'Romance':             { icon: '💕', desc: 'Historias de amor que te dejarán sin aliento',               bg: '#ffe4e6', color: '#9f1239' },
  'Misterio':            { icon: '🔎', desc: 'Secretos, enigmas y giros que nadie predijo',                bg: '#f3e8ff', color: '#6b21a8' },
  'Terror':              { icon: '👻', desc: 'Relatos que te harán leer con la luz encendida',             bg: '#1f2937', color: '#f9fafb' },
  'Thriller':            { icon: '⚡', desc: 'Adrenalina, tensión y giros completamente inesperados',      bg: '#fef3c7', color: '#92400e' },
  'Historia':            { icon: '🏛️', desc: 'Descubre los eventos que moldearon el mundo',               bg: '#fef9c3', color: '#78350f' },
  'Biografía':           { icon: '🧑', desc: 'Vidas reales que inspiran, enseñan y emocionan',            bg: '#e0f2fe', color: '#0c4a6e' },
  'Autoayuda':           { icon: '🌟', desc: 'Herramientas para crecer y ser tu mejor versión',           bg: '#fefce8', color: '#713f12' },
  'Ciencia':             { icon: '🔬', desc: 'Explora los misterios del universo y la naturaleza',         bg: '#dcfce7', color: '#14532d' },
  'Tecnología':          { icon: '💻', desc: 'El mundo digital y la innovación del mañana',               bg: '#e0f2fe', color: '#075985' },
  'Arte':                { icon: '🎨', desc: 'Creatividad, expresión y la historia del arte',             bg: '#fdf4ff', color: '#7e22ce' },
  'Literatura Infantil': { icon: '🧸', desc: 'Aventuras y cuentos mágicos para los más pequeños',         bg: '#fff7ed', color: '#9a3412' },
  'Poesía':              { icon: '✍️', desc: 'Palabras que viven para siempre en el corazón',             bg: '#ffedd5', color: '#9a3412' },
  'Filosofía':           { icon: '💭', desc: 'Preguntas profundas sobre la existencia y la mente',         bg: '#f5f3ff', color: '#581c87' },
  'Economía':            { icon: '📊', desc: 'Mercados, finanzas y el pulso del mundo moderno',           bg: '#ecfdf5', color: '#064e3b' },
  'Derecho':             { icon: '⚖️', desc: 'Normas, justicia y los fundamentos de la ley',             bg: '#fef2f2', color: '#7f1d1d' },
  'Medicina':            { icon: '🩺', desc: 'Salud, bienestar y los secretos del cuerpo humano',         bg: '#f0fdf4', color: '#14532d' },
};

const ALL_GENRES = Object.keys(GENRE_META);

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
  showTip = true;

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

  getMeta(genre: string): GenreMeta {
    return GENRE_META[genre] ?? { icon: '📚', desc: '', bg: '#f3f4f6', color: '#374151' };
  }

  get selectedArray(): string[] {
    return [...this.selected];
  }

  toggle(genre: string) {
    if (this.selected.has(genre)) {
      this.selected.delete(genre);
    } else {
      this.selected.add(genre);
    }
    this.selected = new Set(this.selected);
    this.success = '';
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
