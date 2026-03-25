import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
    newPassword: '',
    confirmPassword: ''
  };

  error = '';
  success = '';
  loading = false;

  onSubmit() {
    this.error = '';
    this.success = '';

    if (this.form.newPassword.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (this.form.newPassword !== this.form.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    // TODO: llamar al endpoint cuando el backend lo implemente
    // this.http.put('/auth/change-password', { password: this.form.newPassword })
    this.success = 'Contraseña actualizada correctamente';
    setTimeout(() => this.closed.emit(), 1500);
  }
}
