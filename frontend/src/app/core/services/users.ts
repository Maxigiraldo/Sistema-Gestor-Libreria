import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface UpdateProfileData {
  username?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  shippingAddress?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}

  createAdmin(data: { username: string; email: string; password: string }) {
    return this.http.post<{ message: string; user: AdminUser }>(
      `${this.base}/users/admins`, data
    );
  }

  listAdmins() {
    return this.http.get<AdminUser[]>(`${this.base}/users/admins`);
  }

  deactivateAdmin(id: number) {
    return this.http.patch<{ message: string }>(
      `${this.base}/users/admins/${id}/deactivate`, {}
    );
  }

  getProfile() {
    return this.http.get<any>(`${this.base}/users/me/profile`);
  }

  updateProfile(data: UpdateProfileData) {
    return this.http.put<any>(`${this.base}/users/me/profile`, data);
  }

  getCategories() {
    return this.http.get<{ favoriteGenres: string[] }>(`${this.base}/users/me/categories`);
  }

  updateCategories(genres: string[]) {
    return this.http.put<any>(`${this.base}/users/me/categories`, { genres });
  }
}
