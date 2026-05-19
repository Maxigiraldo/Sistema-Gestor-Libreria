import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReservationsService, Reservation } from '../../core/services/reservations';
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
  cancellingId: number | null = null;
  cancelError = '';

  selectedItems = new Set<number>(); // exemplar IDs seleccionados para comprar

  constructor(
    private reservationsService: ReservationsService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() { this.load(); }

  private load() {
    this.loading = true;
    this.selectedItems.clear();
    this.reservationsService.getAll().subscribe({
      next: (data) => {
        this.reservations = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudieron cargar las reservas';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get active(): Reservation[] {
    return this.reservations.filter(r => r.status === 'active');
  }

  get past(): Reservation[] {
    return this.reservations.filter(r => r.status !== 'active');
  }

  toggleItem(exemplarId: number) {
    if (this.selectedItems.has(exemplarId)) {
      this.selectedItems.delete(exemplarId);
    } else {
      this.selectedItems.add(exemplarId);
    }
    this.cdr.detectChanges();
  }

  buySelected() {
    if (this.selectedItems.size === 0) return;

    const items: { title: string; author: string; price: number; exemplarId: number }[] = [];

    for (const r of this.active) {
      for (const item of r.items) {
        if (this.selectedItems.has(item.exemplar.id)) {
          items.push({
            exemplarId: item.exemplar.id,
            title: item.exemplar.book.title,
            author: item.exemplar.book.author,
            price: Number(item.exemplar.book.price),
          });
        }
      }
    }

    this.router.navigate(['/checkout'], {
      state: {
        exemplarIds: items.map(i => i.exemplarId),
        items,
        total: items.reduce((s, i) => s + i.price, 0),
        fromReservation: true,
      }
    });
  }

  cancelReservation(id: number) {
    this.cancellingId = id;
    this.cancelError = '';
    this.reservationsService.cancel(id).subscribe({
      next: () => {
        this.cancellingId = null;
        this.load();
      },
      error: (err) => {
        this.cancelError = err.error?.message ?? 'No se pudo cancelar la reserva';
        this.cancellingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  isUrgent(expiresAt: string): boolean {
    return new Date(expiresAt).getTime() - Date.now() < 3 * 3600 * 1000;
  }

  timeLeft(expiresAt: string): string {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expirada';
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
