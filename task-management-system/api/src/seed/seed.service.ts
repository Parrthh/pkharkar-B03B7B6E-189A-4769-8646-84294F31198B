import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { OrganizationEntity } from '../entities/organization.entity';
import { UserEntity } from '../entities/user.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';

@Injectable()
export class SeedService {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        @InjectRepository(OrganizationEntity) private readonly orgRepo: Repository<OrganizationEntity>,
        @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(AuditLogEntity) private readonly auditRepo: Repository<AuditLogEntity>,
    ) { }

    async seed() {
        const userCount = await this.userRepo.count();
        if (userCount > 0) {
            this.logger.log(`Seed skipped (users already exist: ${userCount})`);
            return;
        }

        this.logger.log('Seeding organizations + users...');

        // 2-level org hierarchy
        const parent = this.orgRepo.create({ name: 'Org Parent' });
        await this.orgRepo.save(parent);

        const child = this.orgRepo.create({ name: 'Org Child', parent });
        await this.orgRepo.save(child);

        // Demo password
        const passwordPlain = 'Password123!';
        const passwordHash = await bcrypt.hash(passwordPlain, 10);

        const owner = this.userRepo.create({
            email: 'owner@example.com',
            passwordHash,
            role: 'Owner',
            organization: parent,
        });

        const admin = this.userRepo.create({
            email: 'admin@example.com',
            passwordHash,
            role: 'Admin',
            organization: child,
        });

        const viewer = this.userRepo.create({
            email: 'viewer@example.com',
            passwordHash,
            role: 'Viewer',
            organization: child,
        });

        await this.userRepo.save([owner, admin, viewer]);

        await this.auditRepo.save(
            this.auditRepo.create({
                userId: owner.id,
                action: 'SEED_INIT',
                resourceType: 'seed',
                success: true,
                metadata: JSON.stringify({
                    users: ['owner@example.com', 'admin@example.com', 'viewer@example.com'],
                    password: passwordPlain,
                }),
            }),
        );

        this.logger.log('Seed complete. Demo users created.');
    }
}