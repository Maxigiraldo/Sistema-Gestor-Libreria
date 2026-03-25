import { Component, EventEmitter, Output } from '@angular/core';
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
}
