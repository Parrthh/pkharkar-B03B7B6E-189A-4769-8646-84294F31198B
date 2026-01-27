import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { OrganizationEntity } from './organization.entity';

@Entity('user')
@Unique(['email'])
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    email!: string;

    @Column()
    passwordHash!: string;

    // Storing roles as text i.e., Owner, Admin, Viewer
    @Column({ type: 'text' })
    role!: 'Owner' | 'Admin' | 'Viewer';

    @ManyToOne(() => OrganizationEntity, { eager: true, onDelete: 'CASCADE' })
    organization!: OrganizationEntity;
}