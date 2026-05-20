import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id: number;
  clientId: number;
  senderId: number;
  senderRole: string;
  senderName: string;
  content: string;
  readByAdmin: boolean;
  createdAt: string;
}

export interface Conversation {
  clientId: number;
  clientName: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private base = `${environment.apiUrl}/messaging`;

  constructor(private http: HttpClient) {}

  sendMessage(content: string, clientId?: number) {
    return this.http.post<ChatMessage>(`${this.base}/messages`, { content, clientId });
  }

  getMyConversation() {
    return this.http.get<ChatMessage[]>(`${this.base}/my-messages`);
  }

  getConversations() {
    return this.http.get<Conversation[]>(`${this.base}/conversations`);
  }

  getConversation(clientId: number) {
    return this.http.get<ChatMessage[]>(`${this.base}/messages/${clientId}`);
  }

  markRead(clientId: number) {
    return this.http.post<void>(`${this.base}/messages/${clientId}/read`, {});
  }
}
