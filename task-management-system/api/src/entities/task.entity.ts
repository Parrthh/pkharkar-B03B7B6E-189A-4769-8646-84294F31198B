// api/src/entities/task.entity.ts
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

@Entity('tasks')
export class TaskEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    title!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ default: 'Todo' })
    status!: string;

    @Column({ default: 'Other' })
    category!: string;

    @Column({ name: 'sort_order', type: 'integer', default: 0 })
    sortOrder!: number;

    @ManyToOne(() => OrganizationEntity, { eager: false })
    organization!: OrganizationEntity;

    @ManyToOne(() => UserEntity, { eager: false })
    createdBy!: UserEntity;

    @ManyToOne(() => UserEntity, { eager: false, nullable: true })
    assignedTo!: UserEntity | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}