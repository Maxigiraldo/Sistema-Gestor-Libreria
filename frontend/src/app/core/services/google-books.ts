import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
  private queue: Array<{ fn: () => void; resolve: (v: GoogleBookInfo | null) => void }> = [];
  private processing = false;
  private quotaExhausted = false;
  private readonly DELAY = 1200;
  private readonly DELAY_429 = 15000;

  constructor(private http: HttpClient) {}

  search(title: string, author: string): Observable<GoogleBookInfo | null> {
    const cacheKey = `${title}__${author}`;
    if (this.cache.has(cacheKey)) return of(this.cache.get(cacheKey) ?? null);
    if (this.quotaExhausted) return of(null);

    return new Observable(observer => {
      const resolve = (result: GoogleBookInfo | null) => {
        this.cache.set(cacheKey, result);
        observer.next(result);
        observer.complete();
      };

      const fn = () => {
        const q = encodeURIComponent(`intitle:${title} inauthor:${author}`);
        const key = environment.googleBooksApiKey;
        const url = `${this.base}?q=${q}&maxResults=1${key ? '&key=' + key : ''}`;

        this.http.get<any>(url).pipe(
          map(res => this.parseResponse(res)),
          catchError((err: HttpErrorResponse) => {
            if (err.status === 429) {
              const isDailyLimit = JSON.stringify(err.error ?? '').includes('per day') ||
                                   JSON.stringify(err.error ?? '').includes('RESOURCE_EXHAUSTED');
              if (isDailyLimit) {
                this.quotaExhausted = true;
                this.drainQueue();
              } else {
                // Per-minute rate limit: re-queue at front
                (this as any)._hit429 = true;
                this.queue.unshift({ fn, resolve });
              }
            }
            return of(null);
          })
        ).subscribe(result => {
          if (!((this as any)._hit429 && result === null)) {
            resolve(result);
          }
          (this as any)._hit429 = false;
        });
      };

      this.queue.push({ fn, resolve });
      if (!this.processing) this.processQueue();
    });
  }

  private drainQueue() {
    for (const item of this.queue) {
      item.resolve(null);
    }
    this.queue = [];
    this.processing = false;
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
    if (this.quotaExhausted) { this.drainQueue(); return; }
    this.processing = true;
    const item = this.queue.shift()!;
    item.fn();
    const delay = (this as any)._hit429 ? this.DELAY_429 : this.DELAY;
    setTimeout(() => this.processQueue(), delay);
  }
}
