import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { UsersService, AdminUser } from '../../../core/services/users';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss'
})
export class AdminPanelComponent implements OnInit {
  activeTab: 'list' | 'create' = 'list';

  // Lista
  admins: AdminUser[] = [];
  loadingList = true;
  deactivatingId: number | null = null;

  // Formulario crear
  form = { username: '', email: '', password: '' };
  submitted = false;
  creating = false;
  showPass = false;
  createError = '';
  createSuccess = '';

  constructor(
    private usersService: UsersService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    // Redirigir si no es ROOT
    if (this.auth.getRole() !== 'root') {
      this.router.navigate(['/']);
      return;
    }
    this.loadAdmins();
  }

  loadAdmins() {
    this.loadingList = true;
    this.usersService.listAdmins().subscribe({
      next: (data) => { this.admins = data; this.loadingList = false; },
      error: () => { this.loadingList = false; }
    });
  }

  deactivate(admin: AdminUser) {
    this.deactivatingId = admin.id;
    this.usersService.deactivateAdmin(admin.id).subscribe({
      next: () => {
        admin.active = false;
        this.deactivatingId = null;
      },
      error: () => { this.deactivatingId = null; }
    });
  }

  onCreate() {
    this.submitted = true;
    this.createError = '';
    this.createSuccess = '';

    if (
      !this.form.username.trim() ||
      !this.form.email.trim() ||
      this.form.password.length < 6
    ) return;

    this.creating = true;
    this.usersService.createAdmin(this.form).subscribe({
      next: (res) => {
        this.createSuccess = `Admin "${res.user.username}" creado exitosamente.`;
        this.resetForm();
        this.creating = false;
        this.loadAdmins();
      },
      error: (err) => {
        this.creating = false;
        if (err.status === 409) {
          this.createError = 'Usuario o correo ya registrado.';
        } else {
          this.createError = 'Error al crear el administrador.';
        }
      }
    });
  }

  resetForm() {
    this.form = { username: '', email: '', password: '' };
    this.submitted = false;
    this.showPass = false;
  }
}