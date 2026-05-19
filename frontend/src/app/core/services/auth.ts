import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface LoginResponse {
  message: string;
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(username: string, password: string) {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, { username, password }).pipe(
      tap((res) => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
      }),
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/']);
  }

  isTokenExpired(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expMs = payload.exp * 1000;
      return Date.now() >= expMs;
    } catch {
      return true;
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getRole(): string {
    return this.getUser()?.role ?? '';
  }

  register(data: {
    username: string;
    email: string;
    password: string;
    dni: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    birthPlace: string;
    shippingAddress: string;
    gender: string;
  }) {
    return this.http.post<LoginResponse>(`${this.base}/auth/register`, data).pipe(
      tap((res) => {
        localStorage.setItem('token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
      }),
    );
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.put<{ message: string }>(`${this.base}/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  }
}
