import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLogEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: true })
    userId?: string;

    @Column()
    // For login, task creation
    action!: string;

    @Column()
    // For auth, task
    resourceType!: string;

    @Column({ nullable: true })
    resourceId?: string;

    @Column({ default: true })
    success!: boolean;

    @Column({ type: 'text', nullable: true })
    // JSON string
    metadata?: string;

    @CreateDateColumn()
    createdAt!: Date;
}