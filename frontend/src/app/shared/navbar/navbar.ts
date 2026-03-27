import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ConfirmLogoutComponent } from '../modals/confirm-logout/confirm-logout';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmLogoutComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent implements OnInit {
  user: any = null;
  showLogoutModal = false;

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
  }

  confirmLogout() {
    this.auth.logout();
    this.showLogoutModal = false;
    this.user = null;
    this.cdr.detectChanges();
  }

  cancelLogout() {
    this.showLogoutModal = false;
    this.cdr.detectChanges();
  }
}