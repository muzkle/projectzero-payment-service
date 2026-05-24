import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { PurchaseStatus } from '@projectzero/contracts';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  userId!: string;

  @Column()
  stickerId!: string;

  @Column()
  @Index()
  partnerId!: string;

  @Column({ type: 'int' })
  amountCents!: number;

  @Column({ type: 'int' })
  platformFeeCents!: number;

  @Column({ type: 'int' })
  partnerAmountCents!: number;

  @Column({ unique: true })
  paymentIntentId!: string;

  @Column({ type: 'enum', enum: PurchaseStatus, default: PurchaseStatus.PENDING })
  status!: PurchaseStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
