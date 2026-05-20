import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersService } from '../../../core/services/users';
import { NavbarComponent } from '../../../shared/navbar/navbar';

interface GenreMeta {
  icon: string;
  desc: string;
  bg: string;
}

/* 5-tone muted palette — all tints stay readable with #111827 text */
const W = '#faf6f1'; // warm parchment
const B = '#f0f5fb'; // paper blue
const G = '#f1f8f4'; // soft sage
const L = '#f5f2fb'; // whisper lavender
const P = '#f8f3ef'; // aged paper

const GENRE_META: Record<string, GenreMeta> = {
  'Ficción':             { icon: '📖', desc: 'Mundos imaginarios que llevan a otras realidades',       bg: W },
  'No Ficción':          { icon: '💡', desc: 'Conocimiento, hechos reales y aprendizaje continuo',     bg: B },
  'Ciencia Ficción':     { icon: '🚀', desc: 'El futuro, el espacio y los límites de la tecnología',   bg: L },
  'Fantasía':            { icon: '✨', desc: 'Magia, criaturas y mundos llenos de posibilidades',      bg: G },
  'Romance':             { icon: '📚', desc: 'Historias de amor que no podrás dejar de leer',          bg: W },
  'Misterio':            { icon: '🔍', desc: 'Secretos y enigmas que nadie podía predecir',            bg: L },
  'Terror':              { icon: '🌑', desc: 'Relatos que harán que leas con la luz encendida',        bg: P },
  'Thriller':            { icon: '⚡', desc: 'Adrenalina, tensión y giros inesperados',                bg: P },
  'Historia':            { icon: '📜', desc: 'Descubre los eventos que moldearon el mundo',            bg: W },
  'Biografía':           { icon: '✍️', desc: 'Vidas reales que inspiran, enseñan y emocionan',        bg: B },
  'Autoayuda':           { icon: '🌿', desc: 'Herramientas para crecer y ser tu mejor versión',       bg: G },
  'Ciencia':             { icon: '🔬', desc: 'Los misterios del universo y la naturaleza',             bg: B },
  'Tecnología':          { icon: '💻', desc: 'El mundo digital y la innovación del mañana',           bg: B },
  'Arte':                { icon: '🎨', desc: 'Creatividad, expresión e historia del arte',            bg: L },
  'Literatura Infantil': { icon: '🧸', desc: 'Aventuras y cuentos mágicos para los más pequeños',    bg: G },
  'Poesía':              { icon: '🌸', desc: 'Palabras que viven para siempre en el corazón',         bg: W },
  'Filosofía':           { icon: '💭', desc: 'Preguntas profundas sobre la existencia y la mente',    bg: L },
  'Economía':            { icon: '📊', desc: 'Mercados, finanzas y el pulso del mundo moderno',       bg: B },
  'Derecho':             { icon: '⚖️', desc: 'Normas, justicia y los fundamentos de la ley',         bg: P },
  'Medicina':            { icon: '🩺', desc: 'Salud, bienestar y los secretos del cuerpo humano',    bg: G },
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
    return GENRE_META[genre] ?? { icon: '📚', desc: '', bg: '#f8f3ef' };
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
