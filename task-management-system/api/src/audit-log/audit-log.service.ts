import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLogEntity } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogService {
    constructor(
        @InjectRepository(AuditLogEntity)
        private readonly auditRepo: Repository<AuditLogEntity>,
    ) { }

    async list(limit = 200) {
        const rows = await this.auditRepo.find({
            order: { createdAt: 'DESC' },
            take: limit,
        });

        // return a clean DTO-ish shape
        return rows.map((r) => ({
            id: r.id,
            userId: r.userId ?? null,
            action: r.action,
            resourceType: r.resourceType,
            resourceId: r.resourceId ?? null,
            success: r.success,
            metadata: r.metadata ? safeJson(r.metadata) : null,
            createdAt: r.createdAt.toISOString(),
        }));
    }
}

function safeJson(value: string) {
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}