import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

@Entity('tasks')
export class TaskEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    title!: string;

    @Column({ nullable: true })
    description?: string;

    @Column({ type: 'text', default: 'Work' })
    category!: 'Work' | 'Personal';

    @Column({ type: 'text', default: 'Work' })
    status!: 'ToDo' | 'InProgress' | 'Done';

    @Column({ type: 'int', default: 0 })
    order!: number;

    @ManyToOne(() => OrganizationEntity, { eager: true, onDelete: 'CASCADE' })
    organization!: OrganizationEntity;

    @ManyToOne(() => UserEntity, { eager: true, nullable: true, onDelete: 'SET NULL' })
    createdBy?: UserEntity | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}