import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { UsersService } from '../../../core/services/users';
import { NavbarComponent } from '../../../shared/navbar/navbar';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, NavbarComponent],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.scss'
})
export class EditProfileComponent implements OnInit {
  form = {
    username: '',
    firstName: '',
    lastName: '',
    gender: '',
    shippingAddress: '',
  };

  email = '';
  submitted = false;
  loading = true;
  saving = false;
  success = '';
  error = '';

  constructor(
    private auth: AuthService,
    private users: UsersService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }

    this.users.getProfile().subscribe({
      next: (data: any) => {
        this.form.username = data.username ?? '';
        this.form.firstName = data.profile?.firstName ?? '';
        this.form.lastName = data.profile?.lastName ?? '';
        this.form.gender = data.profile?.gender ?? '';
        this.form.shippingAddress = data.profile?.shippingAddress ?? '';
        this.email = data.email ?? '';
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        const user = this.auth.getUser();
        this.form.username = user?.username ?? '';
        this.email = user?.email ?? '';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';
    this.success = '';
    if (!this.form.username.trim()) return;

    this.saving = true;
    this.users.updateProfile(this.form).subscribe({
      next: () => {
        const user = this.auth.getUser();
        if (user) {
          user.username = this.form.username;
          localStorage.setItem('user', JSON.stringify(user));
        }
        this.saving = false;
        this.success = 'Perfil actualizado correctamente.';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.saving = false;
        this.error = err?.error?.message ?? 'Error al actualizar el perfil';
        this.cdr.detectChanges();
      },
    });
  }
}
