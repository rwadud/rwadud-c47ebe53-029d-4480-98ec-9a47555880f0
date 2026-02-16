import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AuditAction, AuditResource } from '@stms/data';
import { User } from '../users/user.entity';
import { Organization } from '../organizations/organization.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  action: AuditAction;

  @Column({ type: 'varchar' })
  resource: AuditResource;

  @Column()
  resourceId: number;

  @Column()
  userId: number;

  @Column()
  organizationId: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'text', default: '{}' })
  details: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;
}
