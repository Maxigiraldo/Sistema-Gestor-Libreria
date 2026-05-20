import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth';
import { SearchService } from '../../core/services/search';
import { MessagingService, ChatMessage } from '../../core/services/messaging';
import { ReservationsService } from '../../core/services/reservations';
import { ConfirmLogoutComponent } from '../modals/confirm-logout/confirm-logout';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, AsyncPipe, FormsModule, RouterLink, ConfirmLogoutComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  showLogoutModal = false;
  searchQuery = '';

  chatOpen = false;
  chatMessages: ChatMessage[] = [];
  chatInput = '';
  sendingChat = false;
  private pollInterval: any = null;

  constructor(
    public auth: AuthService,
    private searchService: SearchService,
    private messagingService: MessagingService,
    public cartService: ReservationsService,
  ) {}

  ngOnInit() {
    if (this.isClient) {
      this.cartService.refreshCartCount();
    }
  }

  get user() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) return null;
    return JSON.parse(userData);
  }

  get isClient(): boolean {
    return this.user?.role === 'client';
  }

  onSearchInput() {
    this.searchService.setQuery(this.searchQuery);
  }

  confirmLogout() {
    this.auth.logout();
    this.showLogoutModal = false;
  }

  toggleChat() {
    this.chatOpen = !this.chatOpen;
    if (this.chatOpen) {
      this.loadMessages();
      this.pollInterval = setInterval(() => this.loadMessages(), 4000);
    } else {
      this.stopPoll();
    }
  }

  closeChat() {
    this.chatOpen = false;
    this.stopPoll();
  }

  private stopPoll() {
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
  }

  private loadMessages() {
    this.messagingService.getMyConversation().pipe(takeUntil(this.destroy$)).subscribe({
      next: (msgs) => { this.chatMessages = msgs; },
      error: () => {}
    });
  }

  sendMessage() {
    const text = this.chatInput.trim();
    if (!text || this.sendingChat) return;
    this.sendingChat = true;
    this.messagingService.sendMessage(text).pipe(takeUntil(this.destroy$)).subscribe({
      next: (msg) => {
        this.chatMessages = [...this.chatMessages, msg];
        this.chatInput = '';
        this.sendingChat = false;
      },
      error: () => { this.sendingChat = false; }
    });
  }

  ngOnDestroy() {
    this.stopPoll();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
