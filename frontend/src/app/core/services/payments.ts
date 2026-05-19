import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Card {
  id: number;
  type: 'credito' | 'debito';
  lastDigits: string;
  brand: string;
  expiryDate: string;
  active: boolean;
  createdAt: string;
}

export interface Balance {
  id: number;
  available: string;
}

export interface PaymentResult {
  message: string;
  payment: {
    id: number;
    amount: string;
    method: string;
    status: string;
    gatewayReference: string;
    createdAt: string;
  };
}

export interface CreateCardData {
  type: 'credito' | 'debito';
  gatewayToken: string;
  lastDigits: string;
  brand: string;
  expiryDate: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBalance() {
    return this.http.get<Balance>(`${this.base}/payments/balance`);
  }

  getCards() {
    return this.http.get<Card[]>(`${this.base}/payments/cards`);
  }

  addCard(data: CreateCardData) {
    return this.http.post<Card>(`${this.base}/payments/cards`, data);
  }

  removeCard(id: number) {
    return this.http.delete<{ message: string }>(`${this.base}/payments/cards/${id}`);
  }

  processPayment(data: { amount: number; method: 'tarjeta' | 'saldo'; cardId?: number }) {
    return this.http.post<PaymentResult>(`${this.base}/payments/process`, data);
  }
}
