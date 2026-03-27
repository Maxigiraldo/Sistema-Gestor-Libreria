import { Component, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-logout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-logout.html',
  styleUrl: './confirm-logout.scss'
})
export class ConfirmLogoutComponent {
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  onConfirm() {
    this.confirmed.emit();
    this.cdr.detectChanges();
  }

  onCancel() {
    this.cancelled.emit();
    this.cdr.detectChanges();
  }
}