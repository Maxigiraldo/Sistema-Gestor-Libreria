import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface GoogleBookInfo {
  thumbnail: string;
  description: string;
  previewLink: string;
}

@Injectable({ providedIn: 'root' })
export class GoogleBooksService {
  private base = 'https://www.googleapis.com/books/v1/volumes';
  private cache = new Map<string, GoogleBookInfo | null>();
  private queue: Array<() => void> = [];
  private processing = false;
  private readonly DELAY = 800;

  constructor(private http: HttpClient) {}

  search(title: string, author: string): Observable<GoogleBookInfo | null> {
    const cacheKey = `${title}__${author}`;
    if (this.cache.has(cacheKey)) return of(this.cache.get(cacheKey) ?? null);

    return new Observable(observer => {
      this.queue.push(() => {
        const q = encodeURIComponent(`intitle:${title} inauthor:${author}`);
        const key = environment.googleBooksApiKey;

        // Intenta con key primero, si falla intenta sin key
        const urlWithKey = `${this.base}?q=${q}&maxResults=1${key ? '&key=' + key : ''}`;

        this.http.get<any>(urlWithKey).pipe(
          catchError(() => {
            // Fallback sin key
            return this.http.get<any>(`${this.base}?q=${q}&maxResults=1`);
          }),
          map(res => this.parseResponse(res)),
          catchError(() => of(null))
        ).subscribe(result => {
          this.cache.set(cacheKey, result);
          observer.next(result);
          observer.complete();
        });
      });

      if (!this.processing) this.processQueue();
    });
  }

  private parseResponse(res: any): GoogleBookInfo | null {
    const item = res?.items?.[0];
    if (!item) return null;
    const info = item.volumeInfo;
    const links = info.imageLinks ?? {};
    return {
      thumbnail: (links.extraLarge ?? links.large ?? links.medium ?? links.thumbnail ?? '')
                   .replace('http:', 'https:').replace('zoom=1', 'zoom=2'),
      description: info.description ?? '',
      previewLink: info.previewLink ?? '',
    };
  }

  private processQueue() {
    if (this.queue.length === 0) { this.processing = false; return; }
    this.processing = true;
    const next = this.queue.shift()!;
    next();
    setTimeout(() => this.processQueue(), this.DELAY);
  }
}