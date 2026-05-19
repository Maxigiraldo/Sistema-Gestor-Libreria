import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.username.trim() || !this.password.trim()) {
      this.error = 'Completa todos los campos.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401) {
          this.error = 'Usuario o contraseña incorrectos.';
        } else if (err.status === 0) {
          this.error = 'No se pudo conectar con el servidor.';
        } else {
          this.error = 'Ocurrió un error. Intenta de nuevo.';
        }
      }
    });
  }
}