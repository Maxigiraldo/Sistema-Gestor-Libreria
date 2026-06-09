import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { BranchesService, Branch, NearestBranch } from '../../../core/services/branches';

@Component({
  selector: 'app-branch-locations',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './branch-locations.html',
  styleUrl: './branch-locations.scss',
})
export class BranchLocationsComponent implements OnInit {
  branches: Branch[] = [];
  loading = true;
  error = '';

  locating = false;
  nearest: NearestBranch | null = null;
  locationError = '';
  geoUnsupported = false;

  constructor(
    private branchesService: BranchesService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.branchesService.getAll().subscribe({
      next: (data) => { this.branches = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.error = 'No se pudieron cargar las sucursales.'; this.loading = false; this.cdr.detectChanges(); },
    });

    if (!('geolocation' in navigator)) {
      this.geoUnsupported = true;
    }
  }

  findNearest() {
    this.locating = true;
    this.nearest = null;
    this.locationError = '';
    this.cdr.detectChanges();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.branchesService.getNearest(latitude, longitude).subscribe({
          next: (branch) => {
            this.nearest = branch;
            this.locating = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.locationError = 'No se pudo determinar la sucursal más cercana.';
            this.locating = false;
            this.cdr.detectChanges();
          },
        });
      },
      () => {
        this.locationError = 'No se pudo obtener tu ubicación. Verifica los permisos del navegador.';
        this.locating = false;
        this.cdr.detectChanges();
      },
    );
  }

  mapsLink(branch: Branch): string {
    return `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`;
  }

  directionsLink(branch: Branch): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`;
  }
}
