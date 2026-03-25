import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { BooksService, Book } from '../../../core/services/books';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { SidebarComponent } from '../../../shared/sidebar/sidebar';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, NavbarComponent, SidebarComponent],
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss'
})
export class BookListComponent implements OnInit {
  books: Book[] = [];
  loading = true;
  error = '';
  user: any = null;

  constructor(
    private booksService: BooksService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.booksService.getAll().subscribe({
      next: (data) => {
        this.books = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los libros';
        this.loading = false;
      }
    });
  }

  getAvailableCount(book: Book): number {
    return book.exemplars.filter(e => e.available).length;
  }
}
