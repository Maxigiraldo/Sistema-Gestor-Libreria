import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('bonus_config')
export class BonusConfig {
  @PrimaryColumn({ default: 1 })
  id!: number;

  @Column('decimal', { precision: 5, scale: 2, default: 10 })
  discountPercentage!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
