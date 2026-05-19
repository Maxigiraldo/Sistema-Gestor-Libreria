import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OrdersService } from '../../core/services/orders';
import { UsersService } from '../../core/services/users';
import { PaymentsService, Card, Balance } from '../../core/services/payments';
import { NavbarComponent } from '../../shared/navbar/navbar';

interface CheckoutItem {
  exemplarId: number;
  title: string;
  author: string;
  price: number;
}

interface CheckoutState {
  exemplarIds: number[];
  items: CheckoutItem[];
  total: number;
  fromReservation?: boolean;
}

type PaymentMethod = 'tarjeta' | 'saldo' | 'mixto';
type CardType = 'credito' | 'debito';
type CardBrand = 'Visa' | 'Mastercard' | 'American Express' | '';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class CheckoutComponent implements OnInit {
  state: CheckoutState | null = null;
  deliveryType: 'home_delivery' | 'store_pickup' = 'home_delivery';
  shippingAddress = '';
  profileLoaded = false;
  loading = false;
  error = '';
  mapUrl: SafeResourceUrl;

  // Payment
  balance = 0;
  savedCards: Card[] = [];
  paymentMethod: PaymentMethod = 'tarjeta';
  selectedCardId: number | null = null;

  // Card form
  cardNumber = '';
  cardHolderName = '';
  cardExpiry = '';
  cardCvv = '';
  cardType: CardType = 'credito';
  saveCard = false;
  cardBrand: CardBrand = '';
  cardError = '';

  readonly STORE_ADDRESS = 'Cra. 15 #93-47, Chapinero, Bogotá';
  readonly STORE_HOURS = 'Lunes a Sábado: 9:00am – 7:00pm';

  readonly DECLINE_TEST_HINT = 'Para simular rechazo, usa un número que termine en 0002 (ej: 4111111111110002)';

  constructor(
    private router: Router,
    private ordersService: OrdersService,
    private usersService: UsersService,
    private paymentsService: PaymentsService,
    private cdr: ChangeDetectorRef,
    sanitizer: DomSanitizer
  ) {
    this.mapUrl = sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.openstreetmap.org/export/embed.html?bbox=-74.058%2C4.667%2C-74.038%2C4.687&layer=mapnik&marker=4.677%2C-74.048'
    );

    const nav = this.router.getCurrentNavigation();
    const st = (nav?.extras.state ?? window.history.state) as any;

    if (st?.exemplarIds?.length) {
      this.state = {
        exemplarIds: st.exemplarIds,
        items: st.items ?? [],
        total: st.total ?? 0,
        fromReservation: st.fromReservation ?? false,
      };
    } else if (st?.exemplarId) {
      this.state = {
        exemplarIds: [st.exemplarId],
        items: [{ exemplarId: st.exemplarId, title: st.bookTitle, author: st.bookAuthor, price: Number(st.price) }],
        total: Number(st.price),
        fromReservation: false,
      };
    }
  }

  ngOnInit() {
    if (!this.state) { this.router.navigate(['/']); return; }

    this.usersService.getProfile().subscribe({
      next: (data) => {
        this.shippingAddress = data?.profile?.shippingAddress ?? '';
        this.profileLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => { this.profileLoaded = true; this.cdr.detectChanges(); }
    });

    this.paymentsService.getBalance().subscribe({
      next: (b) => { this.balance = Number(b.available); this.cdr.detectChanges(); },
      error: () => {}
    });

    this.paymentsService.getCards().subscribe({
      next: (cards) => { this.savedCards = cards; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  get total(): number { return this.state?.total ?? 0; }
  get amountFromBalance(): number {
    if (this.paymentMethod === 'saldo') return this.total;
    if (this.paymentMethod === 'mixto') return Math.min(this.balance, this.total);
    return 0;
  }
  get amountFromCard(): number {
    if (this.paymentMethod === 'tarjeta') return this.total;
    if (this.paymentMethod === 'mixto') return Math.max(0, this.total - this.balance);
    return 0;
  }
  get needsCard(): boolean {
    return (this.paymentMethod === 'tarjeta' || this.paymentMethod === 'mixto') && this.amountFromCard > 0;
  }
  get balanceSufficient(): boolean { return this.balance >= this.total; }

  selectPaymentMethod(m: PaymentMethod) {
    this.paymentMethod = m;
    this.cardError = '';
    this.error = '';
    this.cdr.detectChanges();
  }

  onCardNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') ?? raw;
    this.cardNumber = formatted;
    input.value = formatted;
    this.cardBrand = this.detectBrand(raw);
    this.cardError = '';
  }

  onCardExpiryInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
    this.cardExpiry = v;
    input.value = v;
  }

  private detectBrand(num: string): CardBrand {
    if (/^4/.test(num)) return 'Visa';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'Mastercard';
    if (/^3[47]/.test(num)) return 'American Express';
    return '';
  }

  private luhn(num: string): boolean {
    const n = num.replace(/\D/g, '');
    if (n.length < 13) return false;
    let sum = 0;
    let alt = false;
    for (let i = n.length - 1; i >= 0; i--) {
      let digit = parseInt(n[i], 10);
      if (alt) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  private validateCardForm(): boolean {
    if (this.selectedCardId) return true;

    const num = this.cardNumber.replace(/\s/g, '');
    if (!num || num.length < 13) { this.cardError = 'Número de tarjeta inválido'; return false; }
    if (!this.luhn(num)) { this.cardError = 'Número de tarjeta inválido — verifica que lo escribiste correctamente'; return false; }
    if (!this.cardBrand) { this.cardError = 'Solo se aceptan Visa, Mastercard y American Express'; return false; }
    if (!this.cardHolderName.trim()) { this.cardError = 'Nombre del titular requerido'; return false; }
    const [mm, yy] = this.cardExpiry.split('/');
    if (!mm || !yy || mm.length !== 2 || yy.length !== 2) { this.cardError = 'Fecha de expiración inválida (MM/AA)'; return false; }
    const yyNum = parseInt(yy, 10);
    const currentYear = new Date().getFullYear();
    // Cards expire within 15 years max; years like "95" → 2095 are physically impossible
    if (2000 + yyNum > currentYear + 15) { this.cardError = 'Fecha de expiración inválida'; return false; }
    const exp = new Date(2000 + yyNum, parseInt(mm, 10) - 1, 1);
    if (exp < new Date()) { this.cardError = 'La tarjeta está vencida'; return false; }
    if (!this.cardCvv || this.cardCvv.length < 3) { this.cardError = 'CVV inválido'; return false; }
    return true;
  }

  confirm() {
    if (!this.state) return;
    if (this.deliveryType === 'home_delivery' && !this.shippingAddress.trim()) {
      this.error = 'Ingresa una dirección de envío.';
      return;
    }
    if (this.paymentMethod === 'saldo' && !this.balanceSufficient) {
      this.error = 'Saldo insuficiente. Elige otro método de pago.';
      return;
    }
    if (this.needsCard && !this.validateCardForm()) return;

    this.loading = true;
    this.error = '';
    this.cardError = '';
    this.cdr.detectChanges();

    this.ordersService.create({
      exemplarIds: this.state.exemplarIds,
      deliveryType: this.deliveryType,
      shippingAddress: this.deliveryType === 'home_delivery' ? this.shippingAddress.trim() : undefined,
      paymentMethod: this.paymentMethod,
      cardNumber: this.needsCard && !this.selectedCardId ? this.cardNumber.replace(/\s/g, '') : undefined,
      cardHolderName: this.needsCard && !this.selectedCardId ? this.cardHolderName : undefined,
      cardExpiry: this.needsCard && !this.selectedCardId ? this.cardExpiry : undefined,
      cardCvv: this.needsCard && !this.selectedCardId ? this.cardCvv : undefined,
      cardType: this.needsCard && !this.selectedCardId ? this.cardType : undefined,
      saveCard: this.needsCard && !this.selectedCardId ? this.saveCard : undefined,
      savedCardId: this.selectedCardId ?? undefined,
      fromReservation: this.state.fromReservation ?? false,
    }).subscribe({
      next: () => this.router.navigate(['/orders']),
      error: (err) => {
        const msg = err.error?.message ?? 'No se pudo realizar el pedido.';
        if (msg.toLowerCase().includes('declinada') || msg.toLowerCase().includes('tarjeta')) {
          this.cardError = msg;
        } else {
          this.error = msg;
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
