import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService, Order } from '../../core/services/orders';
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

  constructor(private ordersService: OrdersService) {}

  ngOnInit() { this.load(); }

  private load() {
    this.loading = true;
    this.ordersService.getAll().subscribe({
      next: (data) => {
        this.orders = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
      },
      error: () => { this.error = 'No se pudieron cargar los pedidos'; this.loading = false; }
    });
  }

  requestCancel(id: number) {
    this.confirmCancelId = id;
    this.cancelError = '';
  }

  confirmCancel() {
    if (!this.confirmCancelId) return;
    const id = this.confirmCancelId;
    this.confirmCancelId = null;
    this.cancellingId = id;

    this.ordersService.cancel(id).subscribe({
      next: () => {
        const order = this.orders.find(o => o.id === id);
        if (order) order.status = 'cancelled';
        this.cancellingId = null;
      },
      error: (err) => {
        this.cancelError = err.error?.message ?? 'No se pudo cancelar el pedido';
        this.cancellingId = null;
      }
    });
  }

  statusLabel(status: string): string {
    return status === 'confirmed' ? 'Confirmado' : 'Cancelado';
  }

  deliveryLabel(type: string): string {
    return type === 'home_delivery' ? 'A domicilio' : 'Recogida en tienda';
  }

  itemCount(order: Order): number {
    return order.details?.length ?? 0;
  }
}
