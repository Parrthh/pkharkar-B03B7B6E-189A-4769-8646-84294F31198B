import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SeedService } from './seed.service';
import { OrganizationEntity } from '../entities/organization.entity';
import { UserEntity } from '../entities/user.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';

@Module({
    imports: [TypeOrmModule.forFeature([OrganizationEntity, UserEntity, AuditLogEntity])],
    providers: [SeedService],
    exports: [SeedService],
})
export class SeedModule { }