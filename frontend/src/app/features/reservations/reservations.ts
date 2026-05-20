import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReservationsService, Reservation, ReservationItem } from '../../core/services/reservations';
import { NavbarComponent } from '../../shared/navbar/navbar';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './reservations.html',
  styleUrl: './reservations.scss'
})
export class ReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  loading = true;
  error = '';
  removingId: number | null = null;
  removeError = '';

  constructor(
    private reservationsService: ReservationsService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() { this.load(); }

  private load() {
    this.loading = true;
    this.reservationsService.getAll().subscribe({
      next: (data) => {
        this.reservations = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudo cargar el carrito';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get cartItems(): ReservationItem[] {
    return this.reservations
      .filter(r => r.status === 'active')
      .flatMap(r => r.items);
  }

  get cartTotal(): number {
    return this.cartItems.reduce((sum, i) => sum + Number(i.exemplar.book.price), 0);
  }

  get cartExpiresAt(): string | null {
    const active = this.reservations.find(r => r.status === 'active');
    return active ? active.expiresAt : null;
  }

  get past(): Reservation[] {
    return this.reservations.filter(r => r.status !== 'active');
  }

  removeItem(exemplarId: number) {
    this.removingId = exemplarId;
    this.removeError = '';
    this.reservationsService.removeFromCart(exemplarId).subscribe({
      next: () => {
        this.removingId = null;
        this.load();
      },
      error: (err) => {
        this.removeError = err.error?.message ?? 'No se pudo eliminar el libro';
        this.removingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  checkout() {
    if (this.cartItems.length === 0) return;
    const items = this.cartItems.map(i => ({
      exemplarId: i.exemplar.id,
      title: i.exemplar.book.title,
      author: i.exemplar.book.author,
      price: Number(i.exemplar.book.price),
    }));
    this.router.navigate(['/checkout'], {
      state: {
        exemplarIds: items.map(i => i.exemplarId),
        items,
        total: this.cartTotal,
        fromReservation: true,
      }
    });
  }

  isUrgent(expiresAt: string): boolean {
    return new Date(expiresAt).getTime() - Date.now() < 3 * 3600 * 1000;
  }

  timeLeft(expiresAt: string): string {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expirado';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      active: 'Activa',
      expired: 'Expirada',
      cancelled: 'Cancelada',
      converted: 'Comprada'
    };
    return map[status] ?? status;
  }

  getBookTitle(r: Reservation): string { return r.items[0]?.exemplar?.book?.title ?? '—'; }
  getBookAuthor(r: Reservation): string { return r.items[0]?.exemplar?.book?.author ?? '—'; }
  getExemplarCode(r: Reservation): string { return r.items[0]?.exemplar?.uniqueCode ?? '—'; }
}
