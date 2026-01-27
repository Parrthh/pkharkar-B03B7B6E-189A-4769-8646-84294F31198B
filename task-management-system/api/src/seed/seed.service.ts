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
        @InjectRepository(OrganizationEntity)
        private readonly orgRepo: Repository<OrganizationEntity>,

        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,

        @InjectRepository(AuditLogEntity)
        private readonly auditRepo: Repository<AuditLogEntity>,
    ) { }

    /**
     * Manual seed entry point
     * Safe to run multiple times
     */
    async seed(): Promise<void> {
        const userCount = await this.userRepo.count();

        if (userCount > 0) {
            this.logger.log(`Seed skipped (users already exist: ${userCount})`);
            return;
        }

        this.logger.log('🌱 Seeding organizations and users...');

        // Organizations (2-level hierarchy)
        const parentOrg = this.orgRepo.create({
            name: 'Org Parent',
        });
        await this.orgRepo.save(parentOrg);

        const childOrg = this.orgRepo.create({
            name: 'Org Child',
            parent: parentOrg,
        });
        await this.orgRepo.save(childOrg);

        // Users
        const passwordPlain = 'Password123!';
        const passwordHash = await bcrypt.hash(passwordPlain, 10);

        const owner = this.userRepo.create({
            email: 'owner@example.com',
            passwordHash,
            role: 'Owner',
            organization: parentOrg,
        });

        const admin = this.userRepo.create({
            email: 'admin@example.com',
            passwordHash,
            role: 'Admin',
            organization: childOrg,
        });

        const viewer = this.userRepo.create({
            email: 'viewer@example.com',
            passwordHash,
            role: 'Viewer',
            organization: childOrg,
        });

        await this.userRepo.save([owner, admin, viewer]);

        // Audit log
        await this.auditRepo.save(
            this.auditRepo.create({
                userId: owner.id,
                action: 'SEED_INIT',
                resourceType: 'seed',
                success: true,
                metadata: JSON.stringify({
                    users: [
                        'owner@example.com',
                        'admin@example.com',
                        'viewer@example.com',
                    ],
                    password: passwordPlain,
                }),
            }),
        );

        this.logger.log('✅ Seed complete. Demo users created.');
    }
}