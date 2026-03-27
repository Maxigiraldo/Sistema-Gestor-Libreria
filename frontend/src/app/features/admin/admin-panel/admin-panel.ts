import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  admins: AdminUser[] = [];
  loadingList = true;
  deactivatingId: number | null = null;

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
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (this.auth.getRole() !== 'root') {
      this.router.navigate(['/']);
      return;
    }
    this.loadAdmins();
  }

  loadAdmins() {
    this.loadingList = true;
    this.usersService.listAdmins().subscribe({
      next: (data) => {
        this.admins = data;
        this.loadingList = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingList = false;
        this.cdr.detectChanges();
      }
    });
  }

  deactivate(admin: AdminUser) {
    this.deactivatingId = admin.id;
    this.usersService.deactivateAdmin(admin.id).subscribe({
      next: () => {
        admin.active = false;
        this.deactivatingId = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.deactivatingId = null;
        this.cdr.detectChanges();
      }
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
    this.cdr.detectChanges();

    this.usersService.createAdmin(this.form).subscribe({
      next: (res) => {
        this.createSuccess = `Admin "${res.user.username}" creado exitosamente.`;
        this.resetForm();
        this.creating = false;
        this.cdr.detectChanges();
        this.loadAdmins();
      },
      error: (err) => {
        this.creating = false;
        this.createError = err.status === 409
          ? 'Usuario o correo ya registrado.'
          : 'Error al crear el administrador.';
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() {
    this.form = { username: '', email: '', password: '' };
    this.submitted = false;
    this.showPass = false;
  }
}