import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Book } from './books';

export interface ReservationItem {
  id: number;
  exemplar: { id: number; uniqueCode: string; book: Book };
  quantity: number;
}

export interface Reservation {
  id: number;
  status: 'active' | 'expired' | 'cancelled' | 'converted';
  expiresAt: string;
  createdAt: string;
  items: ReservationItem[];
}

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private base = environment.apiUrl;

  cartCount$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  addToCart(exemplarId: number) {
    return this.http.post<{ message: string; reservationId: number }>(
      `${this.base}/reservations/cart/add`,
      { exemplarId }
    ).pipe(tap(() => this.refreshCartCount()));
  }

  removeFromCart(exemplarId: number) {
    return this.http.delete<{ message: string }>(
      `${this.base}/reservations/cart/item/${exemplarId}`
    ).pipe(tap(() => this.refreshCartCount()));
  }

  create(exemplarIds: number[]) {
    return this.http.post<{ message: string; reservation: Reservation }>(
      `${this.base}/reservations`,
      { exemplarIds }
    );
  }

  getAll() {
    return this.http.get<Reservation[]>(`${this.base}/reservations`);
  }

  cancel(id: number) {
    return this.http.delete<{ message: string }>(`${this.base}/reservations/${id}`);
  }

  refreshCartCount() {
    this.getAll().subscribe({
      next: (reservations) => {
        const count = reservations
          .filter(r => r.status === 'active')
          .reduce((sum, r) => sum + r.items.length, 0);
        this.cartCount$.next(count);
      },
      error: () => {}
    });
  }
}
