import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { NavbarComponent } from '../../../shared/navbar/navbar';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, NavbarComponent],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.scss'
})
export class EditProfileComponent implements OnInit {
  form = { username: '', email: '', shippingAddress: '' };
  submitted = false;
  saving = false;
  success = '';
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const user = this.auth.getUser();
    if (!user) { this.router.navigate(['/login']); return; }
    this.form.username = user.username;
    this.form.email    = user.email;
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';
    this.success = '';
    if (!this.form.username.trim() || !this.form.email.trim()) return;

    this.saving = true;
    const user = this.auth.getUser();
    const updated = { ...user, username: this.form.username, email: this.form.email };
    localStorage.setItem('user', JSON.stringify(updated));

    this.saving = false;
    this.success = 'Perfil actualizado correctamente.';
    this.cdr.detectChanges();
  }
}