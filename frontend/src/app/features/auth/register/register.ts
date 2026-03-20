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
  form = {
    username: '',
    email: '',
    password: '',
    dni: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    birthPlace: '',
    shippingAddress: '',
    gender: ''
  };

  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.register(this.form).subscribe({
      next: () => this.router.navigate(['/books']),
      error: (err) => {
        this.error = err.error?.message ?? 'Error al registrarse';
        this.loading = false;
      }
    });
  }
}
