import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { PaymentsService, Card, Balance } from '../../../core/services/payments';
import { NewsService } from '../../../core/services/news';
import { ConfirmLogoutComponent } from '../../../shared/modals/confirm-logout/confirm-logout';
import { ChangePasswordComponent } from '../../../shared/modals/change-password/change-password';
import { NavbarComponent } from '../../../shared/navbar/navbar';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmLogoutComponent, ChangePasswordComponent, NavbarComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {
  user: any = null;
  showLogoutModal = false;
  showPasswordModal = false;
  subscribedToNews = false;
  togglingNews = false;

  balance: Balance | null = null;
  savedCards: Card[] = [];
  topupAmount = 50000;
  toppingUp = false;
  topupError = '';
  topupSuccess = '';
  showTopupModal = false;
  removingCardId: number | null = null;

  constructor(
    private auth: AuthService,
    private paymentsService: PaymentsService,
    private newsService: NewsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    if (this.user?.role === 'client') {
      this.loadPaymentData();
      this.newsService.getSubscription().subscribe({
        next: ({ subscribed }) => { this.subscribedToNews = subscribed; this.cdr.detectChanges(); },
        error: () => {}
      });
    }
  }

  private loadPaymentData() {
    this.paymentsService.getBalance().subscribe({
      next: (b) => { this.balance = b; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.paymentsService.getCards().subscribe({
      next: (cards) => { this.savedCards = cards; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  get isClient(): boolean { return this.user?.role === 'client'; }

  toggleNewsSubscription() {
    this.togglingNews = true;
    this.newsService.setSubscription(!this.subscribedToNews).subscribe({
      next: ({ subscribed }) => {
        this.subscribedToNews = subscribed;
        this.togglingNews = false;
        this.cdr.detectChanges();
      },
      error: () => { this.togglingNews = false; this.cdr.detectChanges(); }
    });
  }

  openTopup() {
    this.topupAmount = 50000;
    this.topupError = '';
    this.topupSuccess = '';
    this.showTopupModal = true;
  }

  onTopupInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/[^0-9]/g, '');
    input.value = val;
    this.topupAmount = val ? parseInt(val, 10) : 0;
  }

  confirmTopup() {
    if (!this.topupAmount || this.topupAmount <= 0) {
      this.topupError = 'Ingresa un monto válido';
      return;
    }
    this.toppingUp = true;
    this.topupError = '';
    this.cdr.detectChanges();

    this.paymentsService.topup(this.topupAmount).subscribe({
      next: (b) => {
        this.balance = b;
        this.topupSuccess = `+${this.topupAmount.toLocaleString('es-CO')} COP agregados a tu saldo`;
        this.toppingUp = false;
        this.showTopupModal = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.topupError = err.error?.message ?? 'No se pudo recargar el saldo';
        this.toppingUp = false;
        this.cdr.detectChanges();
      }
    });
  }

  removeCard(card: Card) {
    this.removingCardId = card.id;
    this.cdr.detectChanges();
    this.paymentsService.removeCard(card.id).subscribe({
      next: () => {
        this.savedCards = this.savedCards.filter(c => c.id !== card.id);
        this.removingCardId = null;
        this.cdr.detectChanges();
      },
      error: () => { this.removingCardId = null; this.cdr.detectChanges(); }
    });
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = {
      root: 'ROOT',
      administrator: 'Administrador',
      client: 'Cliente',
      visitor: 'Visitante',
    };
    return map[role] ?? role;
  }

  confirmLogout() { this.auth.logout(); }
}
