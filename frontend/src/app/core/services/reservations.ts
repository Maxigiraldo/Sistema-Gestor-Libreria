import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  constructor(private http: HttpClient) {}

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
}
