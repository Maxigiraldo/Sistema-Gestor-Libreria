import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './set-password.html',
})
export class SetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  submitted = false;
  loading = false;
  success = '';
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.error = 'Enlace inválido. Solicita uno nuevo al administrador ROOT.';
    }
  }

  get passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';
    if (this.password.length < 6 || !this.passwordsMatch) return;

    this.loading = true;
    this.http.post<{ message: string }>(`${environment.apiUrl}/auth/set-password`, {
      token: this.token,
      password: this.password,
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.message;
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message ?? 'Error al configurar la contraseña';
      }
    });
  }
}
