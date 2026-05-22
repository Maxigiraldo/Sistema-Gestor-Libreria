import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Book } from './books';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getNewBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.base}/news/books`);
  }

  getSubscription(): Observable<{ subscribed: boolean }> {
    return this.http.get<{ subscribed: boolean }>(`${this.base}/news/subscription`);
  }

  setSubscription(subscribe: boolean): Observable<{ subscribed: boolean }> {
    return this.http.put<{ subscribed: boolean }>(`${this.base}/news/subscription`, { subscribe });
  }

  getNewBookIds(): Observable<number[]> {
    return this.http.get<number[]>(`${this.base}/news/new-book-ids`);
  }
}
