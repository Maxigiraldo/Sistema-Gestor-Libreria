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
}