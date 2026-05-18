import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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

  constructor(
    private reservationsService: ReservationsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading = true;
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
      converted: 'Convertida en orden'
    };
    return map[status] ?? status;
  }

  getBookTitle(r: Reservation): string {
    return r.items[0]?.exemplar?.book?.title ?? '—';
  }

  getBookAuthor(r: Reservation): string {
    return r.items[0]?.exemplar?.book?.author ?? '—';
  }

  getExemplarCode(r: Reservation): string {
    return r.items[0]?.exemplar?.uniqueCode ?? '—';
  }
}
