import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('organizations')
export class OrganizationEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @ManyToOne(() => OrganizationEntity, (org) => org.children, { nullable: true, onDelete: 'SET NULL' })
    parent?: OrganizationEntity | null;

    @OneToMany(() => OrganizationEntity, (org) => org.parent)
    children!: OrganizationEntity[];
}