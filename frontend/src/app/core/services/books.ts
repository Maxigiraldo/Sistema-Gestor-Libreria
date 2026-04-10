import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Exemplar {
  id: number;
  uniqueCode: string;
  available: boolean;
  outOfStock: boolean;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  price: string;
  condition: string;
  genre: string;
  publisher: string;
  language: string;
  publicationYear: number;
  coverImage?: string;
  exemplars: Exemplar[];
}

@Injectable({ providedIn: 'root' })
export class BooksService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Book[]>(`${this.base}/books`);
  }

  getById(id: number) {
    return this.http.get<Book>(`${this.base}/books/${id}`);
  }

  create(data: Partial<Book> & { quantity: number }) {
  return this.http.post<any>(`${this.base}/books`, data);
}

  update(id: number, data: Partial<Book>) {
    return this.http.put<any>(`${this.base}/books/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<any>(`${this.base}/books/${id}`);
  }
}
