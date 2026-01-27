import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuditLogService } from './audit-log.service';
import { RbacGuard, Roles } from '@org/auth';

@Controller('audit-log')
@UseGuards(AuthGuard('jwt'), RbacGuard)
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) { }

    @Get()
    @Roles('Owner', 'Admin')
    list(@Query('limit') limit?: string) {
        const n = limit ? Number(limit) : 200;
        return this.auditLogService.list(Number.isFinite(n) ? n : 200);
    }
}