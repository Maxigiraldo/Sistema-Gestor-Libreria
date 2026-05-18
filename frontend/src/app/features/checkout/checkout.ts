import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OrdersService } from '../../core/services/orders';
import { UsersService } from '../../core/services/users';
import { NavbarComponent } from '../../shared/navbar/navbar';

interface CheckoutState {
  exemplarId: number;
  bookTitle: string;
  bookAuthor: string;
  price: number;
}

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

  readonly STORE_ADDRESS = 'Cra. 15 #93-47, Chapinero, Bogotá';
  readonly STORE_HOURS = 'Lunes a Sábado: 9:00am – 7:00pm';

  constructor(
    private router: Router,
    private ordersService: OrdersService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef,
    sanitizer: DomSanitizer
  ) {
    this.mapUrl = sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.openstreetmap.org/export/embed.html?bbox=-74.058%2C4.667%2C-74.038%2C4.687&layer=mapnik&marker=4.677%2C-74.048'
    );
    const nav = this.router.getCurrentNavigation();
    const st = (nav?.extras.state ?? window.history.state) as Partial<CheckoutState>;
    if (st?.exemplarId) {
      this.state = st as CheckoutState;
    }
  }

  ngOnInit() {
    if (!this.state) {
      this.router.navigate(['/']);
      return;
    }
    this.usersService.getProfile().subscribe({
      next: (data) => {
        this.shippingAddress = data?.profile?.shippingAddress ?? '';
        this.profileLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.profileLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  get total(): number {
    return this.state?.price ?? 0;
  }

  confirm() {
    if (!this.state) return;
    if (this.deliveryType === 'home_delivery' && !this.shippingAddress.trim()) {
      this.error = 'Ingresa una dirección de envío.';
      this.cdr.detectChanges();
      return;
    }
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    this.ordersService.create({
      exemplarIds: [this.state.exemplarId],
      deliveryType: this.deliveryType,
      shippingAddress: this.deliveryType === 'home_delivery'
        ? this.shippingAddress.trim()
        : undefined,
    }).subscribe({
      next: () => this.router.navigate(['/orders']),
      error: (err) => {
        this.error = err.error?.message ?? 'No se pudo realizar el pedido.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
