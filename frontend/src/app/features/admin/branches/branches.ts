import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { BranchesService, Branch, CreateBranchDto } from '../../../core/services/branches';

type FormMode = 'create' | 'edit';

interface BranchForm {
  name: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  phone: string;
  openingHours: string;
}

@Component({
  selector: 'app-admin-branches',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './branches.html',
  styleUrl: './branches.scss',
})
export class AdminBranchesComponent implements OnInit {
  branches: Branch[] = [];
  loading = true;

  activeTab: 'list' | 'form' = 'list';
  formMode: FormMode = 'create';
  editingId: number | null = null;

  form: BranchForm = this.emptyForm();
  submitted = false;
  saving = false;
  error = '';
  success = '';

  deletingId: number | null = null;

  constructor(
    private branchesService: BranchesService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadBranches();
  }

  loadBranches() {
    this.loading = true;
    this.branchesService.getAll().subscribe({
      next: (data) => { this.branches = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  openCreate() {
    this.formMode = 'create';
    this.editingId = null;
    this.form = this.emptyForm();
    this.submitted = false;
    this.error = '';
    this.success = '';
    this.activeTab = 'form';
  }

  openEdit(branch: Branch) {
    this.formMode = 'edit';
    this.editingId = branch.id;
    this.form = {
      name: branch.name,
      address: branch.address,
      city: branch.city,
      latitude: String(branch.latitude),
      longitude: String(branch.longitude),
      phone: branch.phone ?? '',
      openingHours: branch.openingHours ?? '',
    };
    this.submitted = false;
    this.error = '';
    this.success = '';
    this.activeTab = 'form';
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';
    this.success = '';

    if (!this.isFormValid()) return;

    const dto: CreateBranchDto = {
      name: this.form.name.trim(),
      address: this.form.address.trim(),
      city: this.form.city.trim(),
      latitude: parseFloat(this.form.latitude),
      longitude: parseFloat(this.form.longitude),
      phone: this.form.phone.trim() || undefined,
      openingHours: this.form.openingHours.trim() || undefined,
    };

    this.saving = true;
    this.cdr.detectChanges();

    const req = this.formMode === 'create'
      ? this.branchesService.create(dto)
      : this.branchesService.update(this.editingId!, dto);

    req.subscribe({
      next: () => {
        this.success = this.formMode === 'create'
          ? 'Sucursal creada correctamente.'
          : 'Sucursal actualizada correctamente.';
        this.saving = false;
        this.cdr.detectChanges();
        this.loadBranches();
        setTimeout(() => { this.activeTab = 'list'; this.cdr.detectChanges(); }, 1200);
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message ?? 'Error al guardar la sucursal.';
        this.cdr.detectChanges();
      },
    });
  }

  delete(branch: Branch) {
    this.deletingId = branch.id;
    this.branchesService.remove(branch.id).subscribe({
      next: () => {
        this.branches = this.branches.filter(b => b.id !== branch.id);
        this.deletingId = null;
        this.cdr.detectChanges();
      },
      error: () => { this.deletingId = null; this.cdr.detectChanges(); },
    });
  }

  cancelForm() {
    this.activeTab = 'list';
  }

  private isFormValid(): boolean {
    if (!this.form.name.trim()) return false;
    if (!this.form.address.trim()) return false;
    if (!this.form.city.trim()) return false;
    const lat = parseFloat(this.form.latitude);
    const lng = parseFloat(this.form.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) return false;
    if (isNaN(lng) || lng < -180 || lng > 180) return false;
    return true;
  }

  private emptyForm(): BranchForm {
    return { name: '', address: '', city: '', latitude: '', longitude: '', phone: '', openingHours: '' };
  }

  get latError(): boolean {
    if (!this.submitted) return false;
    const v = parseFloat(this.form.latitude);
    return isNaN(v) || v < -90 || v > 90;
  }

  get lngError(): boolean {
    if (!this.submitted) return false;
    const v = parseFloat(this.form.longitude);
    return isNaN(v) || v < -180 || v > 180;
  }

  mapsLink(branch: Branch): string {
    return `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`;
  }
}
