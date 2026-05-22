import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { timeout, TimeoutError } from 'rxjs';
import { OrdersService, Order } from '../../core/services/orders';
import { ShippingService, Shipping } from '../../core/services/shipping';
import { ReturnsService, ReturnRequest, ReturnCause, RETURN_CAUSE_LABELS, RefundMethod } from '../../core/services/returns';
import { NavbarComponent } from '../../shared/navbar/navbar';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './orders.html',
  styleUrl: './orders.scss'
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  error = '';
  confirmCancelId: number | null = null;
  cancellingId: number | null = null;
  cancelError = '';
  cancelSuccessMsg = '';
  cancelReason = '';
  cancelRefundMethod: 'balance' | 'card' = 'balance';

  expandedOrders = new Set<number>();
  shippingMap: Record<number, Shipping | null | 'loading'> = {};

  // Returns
  returnOrderId: number | null = null;
  returnCause: ReturnCause = 'mal_estado';
  returnDescription = '';
  returnRefundMethod: RefundMethod = 'balance';
  returningId: number | null = null;
  returnError = '';
  returnQrCode: string | null = null;
  returnQrOrderId: number | null = null;
  myReturns: ReturnRequest[] = [];

  readonly returnCauses: { value: ReturnCause; label: string }[] = [
    { value: 'mal_estado', label: RETURN_CAUSE_LABELS['mal_estado'] },
    { value: 'no_expectativas', label: RETURN_CAUSE_LABELS['no_expectativas'] },
    { value: 'demora_entrega', label: RETURN_CAUSE_LABELS['demora_entrega'] },
    { value: 'arrepentimiento', label: RETURN_CAUSE_LABELS['arrepentimiento'] },
    { value: 'pedido_incorrecto', label: RETURN_CAUSE_LABELS['pedido_incorrecto'] },
    { value: 'otro', label: RETURN_CAUSE_LABELS['otro'] },
  ];

  private readonly statusOrder = ['en_preparacion', 'enviado', 'entregado'];

  constructor(
    private ordersService: OrdersService,
    private shippingService: ShippingService,
    private returnsService: ReturnsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.load();
    this.returnsService.getMyReturns().subscribe({
      next: (data) => { this.myReturns = data; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  private load() {
    this.loading = true;
    this.ordersService.getAll().subscribe({
      next: (data) => {
        this.orders = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
        this.cdr.detectChanges();
        // Pre-load shipping for confirmed orders to determine return eligibility
        this.orders.filter(o => o.status === 'confirmed').forEach(o => this.loadShipping(o.id));
      },
      error: () => {
        this.error = 'No se pudieron cargar los pedidos';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  requestCancel(id: number) {
    this.confirmCancelId = id;
    this.cancelError = '';
    this.cancelSuccessMsg = '';
    this.cancelReason = '';
    this.cancelRefundMethod = 'balance';
  }

  confirmCancel() {
    if (!this.confirmCancelId) return;
    const id = this.confirmCancelId;
    this.confirmCancelId = null;
    this.cancellingId = id;
    this.cdr.detectChanges();

    this.ordersService.cancel(id, this.cancelReason.trim() || undefined, this.cancelRefundMethod).subscribe({
      next: (res) => {
        const order = this.orders.find(o => o.id === id);
        if (order) { order.status = 'cancelled'; order.cancelReason = this.cancelReason.trim(); }
        this.cancellingId = null;
        this.cancelSuccessMsg = res.message;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cancelError = err.error?.message ?? 'No se pudo cancelar el pedido';
        this.cancellingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  toggleShipping(orderId: number) {
    if (this.expandedOrders.has(orderId)) {
      this.expandedOrders.delete(orderId);
    } else {
      this.expandedOrders.add(orderId);
      this.loadShipping(orderId);
    }
    this.cdr.detectChanges();
  }

  private loadShipping(orderId: number) {
    if (orderId in this.shippingMap) return;
    this.shippingMap[orderId] = 'loading';
    this.shippingService.getByOrder(orderId).subscribe({
      next: (data) => { this.shippingMap[orderId] = data; this.cdr.detectChanges(); },
      error: () => { this.shippingMap[orderId] = null; this.cdr.detectChanges(); }
    });
  }

  isShippingExpanded(orderId: number) { return this.expandedOrders.has(orderId); }
  isShippingLoading(orderId: number) { return this.shippingMap[orderId] === 'loading'; }

  getShipping(orderId: number): Shipping | null {
    const s = this.shippingMap[orderId];
    if (!s || s === 'loading') return null;
    return s;
  }

  statusReached(current: string, target: string) {
    return this.statusOrder.indexOf(current) >= this.statusOrder.indexOf(target);
  }

  statusLabel(status: string) { return status === 'confirmed' ? 'Confirmado' : 'Cancelado'; }
  deliveryLabel(type: string) { return type === 'home_delivery' ? 'A domicilio' : 'Recogida en tienda'; }

  // Returns
  canReturn(order: Order): boolean {
    const shipping = this.shippingMap[order.id];
    if (!shipping || shipping === 'loading') return false;
    if (typeof shipping === 'object' && shipping.status !== 'entregado') return false;
    const existing = this.myReturns.find(r => r.order.id === order.id);
    if (existing) return false;
    if (typeof shipping === 'object' && shipping.deliveredAt) {
      const deadline = new Date(shipping.deliveredAt);
      deadline.setDate(deadline.getDate() + 8);
      return new Date() <= deadline;
    }
    return false;
  }

  requestReturn(orderId: number) {
    this.returnOrderId = orderId;
    this.returnCause = 'mal_estado';
    this.returnDescription = '';
    this.returnRefundMethod = 'balance';
    this.returnError = '';
    if (!this.expandedOrders.has(orderId)) {
      this.expandedOrders.add(orderId);
      this.loadShipping(orderId);
    }
    this.cdr.detectChanges();
  }

  getReturnForOrder(orderId: number): ReturnRequest | undefined {
    return this.myReturns.find(r => r.order.id === orderId);
  }

  returnStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pendiente: 'Pendiente de revisión',
      aprobada: 'Aprobada por el admin',
      rechazada: 'Rechazada por el admin',
      completada: 'Completada',
    };
    return map[status] ?? status;
  }

  isDescriptionRequired(): boolean {
    return this.returnCause === 'otro';
  }

  canConfirmReturn(): boolean {
    if (!this.returnOrderId) return false;
    if (this.returningId === this.returnOrderId) return false;
    if (this.isDescriptionRequired() && !this.returnDescription.trim()) return false;
    return true;
  }

  isDelivered(orderId: number): boolean {
    const s = this.shippingMap[orderId];
    return typeof s === 'object' && s !== null && (s as any).status === 'entregado';
  }

  confirmReturn() {
    if (!this.returnOrderId) return;
    this.returningId = this.returnOrderId;
    this.returnError = '';
    this.cdr.detectChanges();

    this.returnsService.create({
      orderId: this.returnOrderId,
      cause: this.returnCause,
      additionalDescription: this.returnDescription.trim() || undefined,
      refundMethod: this.returnRefundMethod,
    }).pipe(timeout(20000)).subscribe({
      next: (res) => {
        this.myReturns.push(res.return);
        this.returningId = null;
        this.returnQrCode = res.qrCode;
        this.returnQrOrderId = this.returnOrderId;
        this.returnOrderId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err instanceof TimeoutError) {
          this.returnError = 'El servidor tardó demasiado. Por favor intenta de nuevo.';
        } else {
          this.returnError = err.error?.message ?? 'No se pudo crear la solicitud de devolución';
        }
        this.returningId = null;
        this.cdr.detectChanges();
      }
    });
  }
}
