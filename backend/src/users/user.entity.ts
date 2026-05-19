import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';

export enum UserRole {
  ROOT = 'root',
  ADMIN = 'administrator',
  CLIENT = 'client',
  VISITOR = 'visitor',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true, type: 'varchar' })
  passwordResetToken: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  tokenExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}