import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { SearchService } from '../../core/services/search';
import { ConfirmLogoutComponent } from '../modals/confirm-logout/confirm-logout';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmLogoutComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  showLogoutModal = false;
  searchQuery = '';

  constructor(
    public auth: AuthService,
    private searchService: SearchService
  ) {}

  get user() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) return null;
    return JSON.parse(userData);
  }

  onSearchInput() {
    this.searchService.setQuery(this.searchQuery);
  }

  confirmLogout() {
    this.auth.logout();
    this.showLogoutModal = false;
  }
}
