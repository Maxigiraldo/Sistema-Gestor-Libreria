import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clientId: number;

  @Column()
  senderId: number;

  @Column()
  senderRole: string;

  @Column()
  senderName: string;

  @Column('text')
  content: string;

  @Column({ default: false })
  readByAdmin: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
