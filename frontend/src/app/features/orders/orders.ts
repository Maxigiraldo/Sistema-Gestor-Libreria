import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService, Order } from '../../core/services/orders';
import { ShippingService, Shipping } from '../../core/services/shipping';
import { NavbarComponent } from '../../shared/navbar/navbar';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
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

  expandedOrders = new Set<number>();
  shippingMap: Record<number, Shipping | null | 'loading'> = {};

  private readonly statusOrder = ['en_preparacion', 'enviado', 'entregado'];

  constructor(
    private ordersService: OrdersService,
    private shippingService: ShippingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.load(); }

  private load() {
    this.loading = true;
    this.ordersService.getAll().subscribe({
      next: (data) => {
        this.orders = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
        this.cdr.detectChanges();
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
    this.cdr.detectChanges();
  }

  confirmCancel() {
    if (!this.confirmCancelId) return;
    const id = this.confirmCancelId;
    this.confirmCancelId = null;
    this.cancellingId = id;
    this.cdr.detectChanges();

    this.ordersService.cancel(id).subscribe({
      next: () => {
        const order = this.orders.find(o => o.id === id);
        if (order) order.status = 'cancelled';
        this.cancellingId = null;
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
      next: (data) => {
        this.shippingMap[orderId] = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.shippingMap[orderId] = null;
        this.cdr.detectChanges();
      }
    });
  }

  isShippingExpanded(orderId: number): boolean {
    return this.expandedOrders.has(orderId);
  }

  isShippingLoading(orderId: number): boolean {
    return this.shippingMap[orderId] === 'loading';
  }

  getShipping(orderId: number): Shipping | null {
    const s = this.shippingMap[orderId];
    if (!s || s === 'loading') return null;
    return s;
  }

  statusReached(current: string, target: string): boolean {
    return this.statusOrder.indexOf(current) >= this.statusOrder.indexOf(target);
  }

  statusLabel(status: string): string {
    return status === 'confirmed' ? 'Confirmado' : 'Cancelado';
  }

  deliveryLabel(type: string): string {
    return type === 'home_delivery' ? 'A domicilio' : 'Recogida en tienda';
  }

  shippingStatusLabel(status: string): string {
    const map: Record<string, string> = {
      en_preparacion: 'En preparación',
      enviado: 'Enviado',
      entregado: 'Entregado',
    };
    return map[status] ?? status;
  }

  itemCount(order: Order): number {
    return order.details?.length ?? 0;
  }
}
