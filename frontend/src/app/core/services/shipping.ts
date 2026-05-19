import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Shipping {
  id: number;
  type: 'domicilio' | 'recogida_tienda';
  status: 'en_preparacion' | 'enviado' | 'entregado';
  destinationAddress: string | null;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface ShippingHistoryEntry {
  id: number;
  previousStatus: string;
  newStatus: string;
  observation: string | null;
  changedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ShippingService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getByOrder(orderId: number): Observable<Shipping> {
    return this.http.get<Shipping>(`${this.base}/shipping/order/${orderId}`);
  }

  getHistory(shippingId: number): Observable<ShippingHistoryEntry[]> {
    return this.http.get<ShippingHistoryEntry[]>(
      `${this.base}/shipping/${shippingId}/history`
    );
  }
}
