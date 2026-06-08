import { Injectable } from '@angular/core';
import { ApiService } from './api';

export interface Branch {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  openingHours: string | null;
  active: boolean;
  createdAt: string;
}

export interface NearestBranch extends Branch {
  distanceKm: number;
}

export interface CreateBranchDto {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone?: string;
  openingHours?: string;
}

@Injectable({ providedIn: 'root' })
export class BranchesService {
  constructor(private api: ApiService) {}

  getAll() {
    return this.api.get<Branch[]>('branches');
  }

  getOne(id: number) {
    return this.api.get<Branch>(`branches/${id}`);
  }

  getNearest(lat: number, lng: number) {
    return this.api.get<NearestBranch>(`branches/nearest?lat=${lat}&lng=${lng}`);
  }

  create(dto: CreateBranchDto) {
    return this.api.post<Branch>('branches', dto);
  }

  update(id: number, dto: Partial<CreateBranchDto>) {
    return this.api.put<Branch>(`branches/${id}`, dto);
  }

  remove(id: number) {
    return this.api.delete<void>(`branches/${id}`);
  }
}
