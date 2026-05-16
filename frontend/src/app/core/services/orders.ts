import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Book } from './books';

export interface OrderDetail {
  id: number;
  exemplar: { id: number; uniqueCode: string; book: Book };
  quantity: number;
  unitPrice: string;
  subtotal: string;
}

export interface Order {
  id: number;
  status: 'confirmed' | 'cancelled';
  deliveryType: 'home_delivery' | 'store_pickup';
  shippingAddress: string | null;
  total: string;
  discount: string;
  details: OrderDetail[];
  createdAt: string;
}

export interface CreateOrderData {
  exemplarIds: number[];
  deliveryType: 'home_delivery' | 'store_pickup';
  shippingAddress?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  create(data: CreateOrderData) {
    return this.http.post<{ message: string; order: Order; total: number }>(
      `${this.base}/orders`, data
    );
  }

  getAll() {
    return this.http.get<Order[]>(`${this.base}/orders`);
  }

  getOne(id: number) {
    return this.http.get<Order>(`${this.base}/orders/${id}`);
  }

  cancel(id: number) {
    return this.http.delete<{ message: string }>(`${this.base}/orders/${id}`);
  }
}
