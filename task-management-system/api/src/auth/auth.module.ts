import 'dotenv/config';
import type { StringValue } from 'ms';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../entities/user.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity, AuditLogEntity]),
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET ?? 'add_your_secret_here',
            signOptions: {
                expiresIn: (process.env.JWT_EXPIRES_IN ?? '3600s') as StringValue,
            },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule { }