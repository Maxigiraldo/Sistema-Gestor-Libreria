import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-bonus-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './bonus-config.html',
  styleUrl: './bonus-config.scss',
})
export class BonusConfigComponent implements OnInit {
  private base = environment.apiUrl;

  currentPercentage: number | null = null;
  newPercentage: number | null = null;
  isRoot = false;

  loading = true;
  saving = false;
  success = '';
  error = '';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const role = this.auth.getRole();
    this.isRoot = role === 'root' || role === 'administrator';
    this.http.get<{ discountPercentage: number }>(`${this.base}/config/bonus`).subscribe({
      next: (res) => {
        this.currentPercentage = Number(res.discountPercentage);
        this.newPercentage = this.currentPercentage;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudo cargar la configuración del bono';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  save() {
    if (this.newPercentage === null || this.newPercentage < 0 || this.newPercentage > 100) {
      this.error = 'El porcentaje debe estar entre 0 y 100';
      return;
    }

    this.saving = true;
    this.success = '';
    this.error = '';

    this.http
      .put<any>(`${this.base}/config/bonus`, { percentage: this.newPercentage })
      .subscribe({
        next: (res) => {
          this.currentPercentage = Number(res.discountPercentage);
          this.saving = false;
          this.success = 'Bono actualizado correctamente.';
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.saving = false;
          this.error = err?.error?.message ?? 'Error al actualizar el bono';
          this.cdr.detectChanges();
        },
      });
  }
}
