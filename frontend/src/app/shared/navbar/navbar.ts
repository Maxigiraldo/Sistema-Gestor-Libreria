import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ConfirmLogoutComponent } from '../modals/confirm-logout/confirm-logout';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmLogoutComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  showLogoutModal = false;

  constructor(public auth: AuthService) {}

  get user() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) return null;
    return JSON.parse(userData);
  }

  confirmLogout() {
    this.auth.logout();
    this.showLogoutModal = false;
  }
}
