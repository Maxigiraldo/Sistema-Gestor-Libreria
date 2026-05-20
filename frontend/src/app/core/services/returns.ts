import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type RefundMethod = 'balance' | 'card';

export const REFUND_METHOD_LABELS: Record<RefundMethod, string> = {
  balance: 'Saldo de cuenta (inmediato)',
  card: 'Tarjeta original (7 días hábiles)',
};

export type ReturnCause =
  | 'mal_estado'
  | 'no_expectativas'
  | 'demora_entrega'
  | 'arrepentimiento'
  | 'pedido_incorrecto'
  | 'otro';

export type ReturnStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'completada';

export const RETURN_CAUSE_LABELS: Record<ReturnCause, string> = {
  mal_estado: 'Producto defectuoso',
  no_expectativas: 'No corresponde a la descripción',
  demora_entrega: 'Llegó dañado durante el envío',
  arrepentimiento: 'Me arrepentí de la compra',
  pedido_incorrecto: 'Recibí el pedido equivocado',
  otro: 'Otro',
};

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  completada: 'Completada',
};

export interface ReturnRequest {
  id: number;
  order: { id: number };
  cause: ReturnCause;
  additionalDescription: string;
  refundMethod: RefundMethod;
  qrCode: string;
  deadlineDate: string;
  status: ReturnStatus;
  createdAt: string;
  client?: { id: number; username: string; email: string };
}

export interface CreateReturnData {
  orderId: number;
  cause: ReturnCause;
  additionalDescription?: string;
  refundMethod: RefundMethod;
}

@Injectable({ providedIn: 'root' })
export class ReturnsService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  create(data: CreateReturnData) {
    return this.http.post<{ message: string; return: ReturnRequest; qrCode: string }>(
      `${this.base}/returns`, data
    );
  }

  getMyReturns() {
    return this.http.get<ReturnRequest[]>(`${this.base}/returns`);
  }

  getById(id: number) {
    return this.http.get<ReturnRequest>(`${this.base}/returns/${id}`);
  }

  getAllReturns() {
    return this.http.get<ReturnRequest[]>(`${this.base}/returns/admin/all`);
  }

  updateStatus(id: number, status: ReturnStatus) {
    return this.http.put<ReturnRequest>(`${this.base}/returns/${id}/status`, { status });
  }
}
