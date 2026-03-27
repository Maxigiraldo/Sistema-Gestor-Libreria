import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {

  step = 1;
  submitted1 = false;
  submitted2 = false;

  // Paso 1
  firstName       = '';
  lastName        = '';
  dni             = '';
  birthDate       = '';
  birthPlace      = '';
  gender          = '';
  shippingAddress = '';

  // Paso 2
  username      = '';
  email         = '';
  password      = '';
  acceptPrivacy = false;
  showPassword  = false;

  loading = false;
  error   = '';

  constructor(private auth: AuthService, private router: Router) {}

  get maxBirthDate(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d.toISOString().split('T')[0];
  }

  get minBirthDate(): string {
    return '1925-01-01';
  }

  togglePassword() { this.showPassword = !this.showPassword; }

  // ── Validaciones ────────────────────────────────────────────────────────────

  dniValid(): boolean {
    return /^\d{6,12}$/.test(this.dni.trim());
  }

  emailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.email.trim());
  }

  usernameValid(): boolean {
    return /^[a-zA-Z0-9_-]{3,30}$/.test(this.username.trim());
  }

  // ── Navegación ──────────────────────────────────────────────────────────────

  goStep2() {
    this.submitted1 = true;
    if (
      this.firstName.trim() &&
      this.lastName.trim() &&
      this.dniValid() &&
      this.birthDate &&
      this.birthPlace.trim() &&
      this.gender &&
      this.shippingAddress.trim()
    ) {
      this.step = 2;
      this.submitted1 = false;
    }
  }

  goStep1() {
    this.step = 1;
    this.error = '';
  }

  onSubmit() {
    this.submitted2 = true;
    this.error = '';

    if (
      !this.usernameValid() ||
      !this.emailValid()    ||
      this.password.length < 6 ||
      !this.acceptPrivacy
    ) return;

    this.loading = true;

    this.auth.register({
      firstName:       this.firstName,
      lastName:        this.lastName,
      dni:             this.dni,
      birthDate:       this.birthDate,
      birthPlace:      this.birthPlace,
      gender:          this.gender,
      shippingAddress: this.shippingAddress,
      username:        this.username,
      email:           this.email,
      password:        this.password,
    }).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/']); },
      error: (err) => {
        this.loading = false;
        if (err.status === 409)      this.error = 'El correo o usuario ya está registrado.';
        else if (err.status === 400) this.error = err.error?.message ?? 'Revisa los datos ingresados.';
        else if (err.status === 0)   this.error = 'No se pudo conectar con el servidor.';
        else                         this.error = 'Ocurrió un error. Intenta de nuevo.';
      },
      complete: () => { this.loading = false; }
    });
  }
}