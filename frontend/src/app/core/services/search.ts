import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Book } from './books';

export interface SearchParams {
  title?: string;
  author?: string;
  genre?: string;
  condition?: string;
  minPrice?: string;
  maxPrice?: string;
}

export interface SearchResult {
  total: number;
  results: Book[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private base = environment.apiUrl;
  private querySubject = new BehaviorSubject<string>('');
  query$ = this.querySubject.asObservable();

  constructor(private http: HttpClient) {}

  setQuery(q: string) {
    this.querySubject.next(q);
  }

  getCurrentQuery(): string {
    return this.querySubject.getValue();
  }

  search(params: SearchParams) {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value);
      }
    }
    return this.http.get<SearchResult>(`${this.base}/search`, { params: httpParams });
  }
}
