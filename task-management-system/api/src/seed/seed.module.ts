import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SeedService } from './seed.service';
import { OrganizationEntity } from '../entities/organization.entity';
import { UserEntity } from '../entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            OrganizationEntity,
            UserEntity,
        ]),
    ],
    providers: [SeedService],
})
export class SeedModule { }