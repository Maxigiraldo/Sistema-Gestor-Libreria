import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReturnsService, ReturnRequest, RETURN_CAUSE_LABELS, RETURN_STATUS_LABELS } from '../../../core/services/returns';
import { NavbarComponent } from '../../../shared/navbar/navbar';

@Component({
  selector: 'app-return-status',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './return-status.html',
  styleUrl: './return-status.scss',
})
export class ReturnStatusComponent implements OnInit {
  ret: ReturnRequest | null = null;
  loading = true;
  error = '';

  readonly causeLabels = RETURN_CAUSE_LABELS;
  readonly statusLabels = RETURN_STATUS_LABELS;

  readonly steps = ['pendiente', 'aprobada', 'completada'] as const;

  constructor(
    private route: ActivatedRoute,
    private returnsService: ReturnsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.returnsService.getById(id).subscribe({
      next: (data) => { this.ret = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.error = 'No se encontró la solicitud o no tienes acceso.'; this.loading = false; this.cdr.detectChanges(); },
    });
  }

  stepReached(step: string): boolean {
    if (!this.ret) return false;
    if (this.ret.status === 'rechazada') return step === 'pendiente';
    const order = ['pendiente', 'aprobada', 'completada'];
    return order.indexOf(this.ret.status) >= order.indexOf(step);
  }

  get isRejected() { return this.ret?.status === 'rechazada'; }
}
