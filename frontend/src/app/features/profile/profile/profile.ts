import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ConfirmLogoutComponent } from '../../../shared/modals/confirm-logout/confirm-logout';
import { ChangePasswordComponent } from '../../../shared/modals/change-password/change-password';
import { NavbarComponent } from '../../../shared/navbar/navbar';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmLogoutComponent, ChangePasswordComponent, NavbarComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {
  user: any = null;
  showLogoutModal = false;
  showPasswordModal = false;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.user = this.auth.getUser();
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = {
      root: 'ROOT',
      administrator: 'Administrador',
      client: 'Cliente',
      visitor: 'Visitante',
    };
    return map[role] ?? role;
  }

  confirmLogout() { this.auth.logout(); }
}