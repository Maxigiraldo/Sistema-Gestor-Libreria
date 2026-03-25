import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.scss'
})
export class EditProfileComponent implements OnInit {
  form = {
    username: '',
    email: '',
  };

  success = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const user = this.auth.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.form.username = user.username;
    this.form.email = user.email;
  }

  onSubmit() {
    const user = this.auth.getUser();
    const updated = { ...user, ...this.form };
    localStorage.setItem('user', JSON.stringify(updated));
    this.success = 'Perfil actualizado localmente';
  }
}
