import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { UserEntity } from '../entities/user.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';
import type { JwtPayload, LoginRequestDto, LoginResponseDto } from '@org/data';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly usersRepo: Repository<UserEntity>,

        @InjectRepository(AuditLogEntity)
        private readonly auditRepo: Repository<AuditLogEntity>,

        private readonly jwtService: JwtService,
    ) { }

    async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
        // Make sure we load organization so we can safely set organizationId in JWT payload
        const user = await this.usersRepo.findOne({
            where: { email: dto.email },
            relations: { organization: true },
        });

        if (!user || !user.passwordHash) {
            await this.auditRepo.save(
                this.auditRepo.create({
                    userId: user?.id,
                    action: 'LOGIN',
                    resourceType: 'auth',
                    success: false,
                    metadata: JSON.stringify({ email: dto.email, reason: 'user_not_found' }),
                }),
            );
            throw new UnauthorizedException('Invalid credentials');
        }

        const ok = await bcrypt.compare(dto.password, user.passwordHash);
        if (!ok) {
            await this.auditRepo.save(
                this.auditRepo.create({
                    userId: user.id,
                    action: 'LOGIN',
                    resourceType: 'auth',
                    success: false,
                    metadata: JSON.stringify({ email: dto.email, reason: 'bad_password' }),
                }),
            );
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role as any,
            organizationId: user.organization?.id,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        await this.auditRepo.save(
            this.auditRepo.create({
                userId: user.id,
                action: 'LOGIN',
                resourceType: 'auth',
                success: true,
                metadata: JSON.stringify({ email: user.email }),
            }),
        );

        return { accessToken };
    }
}