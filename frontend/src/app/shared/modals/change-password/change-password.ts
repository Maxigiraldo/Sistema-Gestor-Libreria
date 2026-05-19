import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss'
})
export class ChangePasswordComponent {
  @Output() closed = new EventEmitter<void>();

  form = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  error = '';
  success = '';
  loading = false;

  constructor(private auth: AuthService) {}

  onSubmit() {
    this.error = '';
    this.success = '';

    if (!this.form.currentPassword) {
      this.error = 'Ingresa tu contraseña actual';
      return;
    }

    if (this.form.newPassword.length < 6) {
      this.error = 'La nueva contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (this.form.newPassword !== this.form.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.loading = true;
    this.auth.changePassword(this.form.currentPassword, this.form.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Contraseña actualizada correctamente';
        setTimeout(() => this.closed.emit(), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error al cambiar la contraseña';
      },
    });
  }
}
