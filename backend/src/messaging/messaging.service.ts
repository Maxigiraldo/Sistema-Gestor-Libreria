import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
  ) {}

  async send(senderId: number, senderRole: string, senderName: string, clientId: number, content: string): Promise<Message> {
    const msg = this.messageRepo.create({ senderId, senderRole, senderName, clientId, content });
    return this.messageRepo.save(msg);
  }

  async getConversation(clientId: number): Promise<Message[]> {
    return this.messageRepo.find({
      where: { clientId },
      order: { createdAt: 'ASC' },
    });
  }

  async getConversations(): Promise<any[]> {
    const rows: { clientId: number }[] = await this.messageRepo.query(
      `SELECT DISTINCT "clientId" FROM messages`,
    );

    const results = await Promise.all(
      rows.map(async ({ clientId }) => {
        const last = await this.messageRepo.findOne({
          where: { clientId },
          order: { createdAt: 'DESC' },
        });
        const clientMsg = await this.messageRepo.findOne({
          where: { clientId, senderRole: 'client' },
          order: { createdAt: 'ASC' },
        });
        const unread = await this.messageRepo.count({
          where: { clientId, senderRole: 'client', readByAdmin: false },
        });
        return {
          clientId,
          clientName: clientMsg?.senderName ?? `Cliente #${clientId}`,
          lastMessage: last?.content ?? '',
          lastMessageAt: last?.createdAt ?? null,
          unread,
        };
      }),
    );

    return results.sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });
  }

  async markRead(clientId: number): Promise<void> {
    await this.messageRepo.update(
      { clientId, senderRole: 'client', readByAdmin: false },
      { readByAdmin: true },
    );
  }
}
