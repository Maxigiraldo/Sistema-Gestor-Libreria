import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { UsersService, AdminUser } from '../../../core/services/users';
import { AuthService } from '../../../core/services/auth';
import { ReturnsService, ReturnRequest, ReturnStatus, RETURN_CAUSE_LABELS, RETURN_STATUS_LABELS } from '../../../core/services/returns';
import { MessagingService, ChatMessage, Conversation } from '../../../core/services/messaging';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss'
})
export class AdminPanelComponent implements OnInit {
  activeTab: 'list' | 'create' | 'returns' | 'messages' = 'list';
  isRoot = false;

  admins: AdminUser[] = [];
  loadingList = true;
  deactivatingId: number | null = null;

  form = { username: '', email: '' };
  submitted = false;
  creating = false;
  createError = '';
  createSuccess = '';

  // Returns
  returns: ReturnRequest[] = [];
  loadingReturns = false;
  updatingReturnId: number | null = null;

  readonly CAUSE_LABELS = RETURN_CAUSE_LABELS;
  readonly STATUS_LABELS = RETURN_STATUS_LABELS;

  conversations: Conversation[] = [];
  loadingConversations = false;
  selectedConversation: Conversation | null = null;
  conversationMessages: ChatMessage[] = [];
  loadingMessages = false;
  adminChatInput = '';
  sendingAdminChat = false;
  private msgPollInterval: any = null;

  constructor(
    private usersService: UsersService,
    private auth: AuthService,
    private returnsService: ReturnsService,
    private messagingService: MessagingService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const role = this.auth.getRole();
    if (role !== 'root' && role !== 'administrator') {
      this.router.navigate(['/']);
      return;
    }
    this.isRoot = role === 'root';

    if (this.isRoot) {
      this.loadAdmins();
      this.activeTab = 'list';
    } else {
      this.activeTab = 'returns';
    }

    this.loadReturns();
  }

  loadAdmins() {
    this.loadingList = true;
    this.usersService.listAdmins().subscribe({
      next: (data) => { this.admins = data; this.loadingList = false; this.cdr.detectChanges(); },
      error: () => { this.loadingList = false; this.cdr.detectChanges(); }
    });
  }

  deactivate(admin: AdminUser) {
    this.deactivatingId = admin.id;
    this.usersService.deactivateAdmin(admin.id).subscribe({
      next: () => { admin.active = false; this.deactivatingId = null; this.cdr.detectChanges(); },
      error: () => { this.deactivatingId = null; this.cdr.detectChanges(); }
    });
  }

  onCreate() {
    this.submitted = true;
    this.createError = '';
    this.createSuccess = '';
    if (!this.form.username.trim() || !this.form.email.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(this.form.email.trim())) return;

    this.creating = true;
    this.cdr.detectChanges();

    this.usersService.createAdmin(this.form).subscribe({
      next: (res) => {
        this.createSuccess = `Admin "${res.user.username}" creado exitosamente.`;
        this.resetForm();
        this.creating = false;
        this.cdr.detectChanges();
        this.loadAdmins();
      },
      error: (err) => {
        this.creating = false;
        this.createError = err.status === 409 ? 'Usuario o correo ya registrado.' : 'Error al crear el administrador.';
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() { this.form = { username: '', email: '' }; this.submitted = false; }

  expandedReturnId: number | null = null;
  toggleReturnDetail(id: number) {
    this.expandedReturnId = this.expandedReturnId === id ? null : id;
    this.cdr.detectChanges();
  }

  // Returns management
  loadReturns() {
    this.loadingReturns = true;
    this.returnsService.getAllReturns().subscribe({
      next: (data) => { this.returns = data; this.loadingReturns = false; this.cdr.detectChanges(); },
      error: () => { this.loadingReturns = false; this.cdr.detectChanges(); }
    });
  }

  updateReturnStatus(ret: ReturnRequest, status: ReturnStatus) {
    this.updatingReturnId = ret.id;
    this.cdr.detectChanges();
    this.returnsService.updateStatus(ret.id, status).subscribe({
      next: (updated) => {
        const idx = this.returns.findIndex(r => r.id === ret.id);
        if (idx > -1) this.returns[idx] = updated;
        this.updatingReturnId = null;
        this.cdr.detectChanges();
      },
      error: () => { this.updatingReturnId = null; this.cdr.detectChanges(); }
    });
  }

  causeLabel(cause: string): string { return (this.CAUSE_LABELS as any)[cause] ?? cause; }
  statusLabel(status: string): string { return (this.STATUS_LABELS as any)[status] ?? status; }

  get totalUnread(): number {
    return this.conversations.reduce((s, c) => s + (c.unread || 0), 0);
  }

  loadMessages() {
    this.loadingConversations = true;
    this.messagingService.getConversations().subscribe({
      next: (data) => { this.conversations = data; this.loadingConversations = false; this.cdr.detectChanges(); },
      error: () => { this.loadingConversations = false; this.cdr.detectChanges(); }
    });
  }

  openConversation(conv: Conversation) {
    this.selectedConversation = conv;
    this.loadingMessages = true;
    this.messagingService.markRead(conv.clientId).subscribe();
    conv.unread = 0;
    this.fetchMessages(conv.clientId);
    if (this.msgPollInterval) clearInterval(this.msgPollInterval);
    this.msgPollInterval = setInterval(() => this.fetchMessages(conv.clientId), 4000);
  }

  fetchMessages(clientId: number) {
    this.messagingService.getConversation(clientId).subscribe({
      next: (msgs) => { this.conversationMessages = msgs; this.loadingMessages = false; this.cdr.detectChanges(); },
      error: () => { this.loadingMessages = false; }
    });
  }

  sendAdminMessage() {
    const text = this.adminChatInput.trim();
    if (!text || !this.selectedConversation || this.sendingAdminChat) return;
    this.sendingAdminChat = true;
    this.messagingService.sendMessage(text, this.selectedConversation.clientId).subscribe({
      next: (msg) => {
        this.conversationMessages = [...this.conversationMessages, msg];
        this.adminChatInput = '';
        this.sendingAdminChat = false;
        this.cdr.detectChanges();
      },
      error: () => { this.sendingAdminChat = false; this.cdr.detectChanges(); }
    });
  }

  ngOnDestroy() {
    if (this.msgPollInterval) clearInterval(this.msgPollInterval);
  }
}
