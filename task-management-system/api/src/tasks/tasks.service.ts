import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { TaskEntity } from '../entities/task.entity';
import { OrganizationEntity } from '../entities/organization.entity';
import { UserEntity } from '../entities/user.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';

import type {
    CreateTaskDto,
    UpdateTaskDto,
    JwtPayload,
    TaskDto,
} from '@org/data';

function roleRank(role: string): number {
    // Keep this string-based to avoid TS fighting when Role type comes from @org/data
    if (role === 'Owner') return 3;
    if (role === 'Admin') return 2;
    return 1; // Viewer or anything else
}

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(TaskEntity)
        private readonly taskRepo: Repository<TaskEntity>,

        @InjectRepository(OrganizationEntity)
        private readonly orgRepo: Repository<OrganizationEntity>,

        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,

        @InjectRepository(AuditLogEntity)
        private readonly auditRepo: Repository<AuditLogEntity>,
    ) { }

    private async getAccessibleOrgIds(user: JwtPayload): Promise<string[]> {
        const me = await this.userRepo.findOne({
            where: { id: user.sub },
            relations: { organization: { children: true } },
        });

        // fallback: at least their own orgId from JWT
        if (!me?.organization) return [user.organizationId];

        const myOrg = me.organization;
        const ids = new Set<string>([myOrg.id]);

        // Admin/Owner can also see child org tasks
        if (roleRank(String(user.role)) >= roleRank('Admin')) {
            (myOrg.children ?? []).forEach((c) => ids.add(c.id));
        }

        return Array.from(ids);
    }

    private async audit(
        user: JwtPayload,
        action: string,
        success: boolean,
        metadata: unknown,
    ) {
        await this.auditRepo.save(
            this.auditRepo.create({
                userId: user.sub,
                action,
                resourceType: 'task',
                success,
                metadata: JSON.stringify(metadata ?? {}),
            }),
        );
    }

    async list(user: JwtPayload): Promise<TaskDto[]> {
        const orgIds = await this.getAccessibleOrgIds(user);
        const role = String(user.role);

        // Viewer: only tasks assigned to them OR created by them (within accessible orgs)
        // Admin/Owner: all tasks in accessible orgs
        const where =
            role === 'Viewer'
                ? [
                    {
                        organization: { id: In(orgIds) },
                        assignedTo: { id: user.sub },
                    },
                    {
                        organization: { id: In(orgIds) },
                        createdBy: { id: user.sub },
                    },
                ]
                : [{ organization: { id: In(orgIds) } }];

        const tasks = await this.taskRepo.find({
            where,
            relations: { organization: true, createdBy: true, assignedTo: true },
            order: { sortOrder: 'ASC', createdAt: 'DESC' }, // ✅ use sortOrder (DB)
        });

        await this.audit(user, 'LIST', true, { count: tasks.length, orgIds });

        return tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status as any,
            category: t.category as any,

            // ✅ map DB field -> DTO field
            order: t.sortOrder,

            organizationId: t.organization.id,
            createdById: t.createdBy.id,
            assignedToId: t.assignedTo?.id ?? null,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
        }));
    }

    async create(user: JwtPayload, dto: CreateTaskDto): Promise<TaskDto> {
        const role = String(user.role);
        if (roleRank(role) < roleRank('Admin')) {
            await this.audit(user, 'CREATE', false, { reason: 'insufficient_role' });
            throw new ForbiddenException('Insufficient role');
        }

        const orgIds = await this.getAccessibleOrgIds(user);
        const targetOrgId = dto.organizationId ?? user.organizationId;

        if (!orgIds.includes(targetOrgId)) {
            await this.audit(user, 'CREATE', false, {
                reason: 'org_forbidden',
                targetOrgId,
            });
            throw new ForbiddenException('Cannot create task in that organization');
        }

        const org = await this.orgRepo.findOne({ where: { id: targetOrgId } });
        if (!org) throw new NotFoundException('Organization not found');

        const creator = await this.userRepo.findOne({ where: { id: user.sub } });
        if (!creator) throw new NotFoundException('User not found');

        const assignedTo = dto.assignedToId
            ? await this.userRepo.findOne({ where: { id: dto.assignedToId } })
            : null;

        const task = this.taskRepo.create({
            title: dto.title,
            description: dto.description ?? null,
            status: (dto.status ?? 'Todo') as any,
            category: (dto.category ?? 'Other') as any,

            // ✅ map DTO order -> DB sortOrder
            sortOrder: dto.order ?? 0,

            organization: org,
            createdBy: creator,
            assignedTo: assignedTo ?? null,
        });

        const saved = await this.taskRepo.save(task);
        await this.audit(user, 'CREATE', true, { taskId: saved.id, targetOrgId });

        return {
            id: saved.id,
            title: saved.title,
            description: saved.description,
            status: saved.status as any,
            category: saved.category as any,

            // ✅ map DB field -> DTO field
            order: saved.sortOrder,

            organizationId: org.id,
            createdById: creator.id,
            assignedToId: assignedTo?.id ?? null,
            createdAt: saved.createdAt.toISOString(),
            updatedAt: saved.updatedAt.toISOString(),
        };
    }

    async update(user: JwtPayload, id: string, dto: UpdateTaskDto): Promise<TaskDto> {
        const role = String(user.role);
        if (roleRank(role) < roleRank('Admin')) {
            await this.audit(user, 'UPDATE', false, { reason: 'insufficient_role', id });
            throw new ForbiddenException('Insufficient role');
        }

        const orgIds = await this.getAccessibleOrgIds(user);

        const task = await this.taskRepo.findOne({
            where: { id },
            relations: { organization: true, createdBy: true, assignedTo: true },
        });
        if (!task) throw new NotFoundException('Task not found');

        if (!orgIds.includes(task.organization.id)) {
            await this.audit(user, 'UPDATE', false, { reason: 'org_forbidden', id });
            throw new ForbiddenException('Cannot update task in that organization');
        }

        if (dto.assignedToId !== undefined) {
            task.assignedTo = dto.assignedToId
                ? await this.userRepo.findOne({ where: { id: dto.assignedToId } })
                : null;
        }

        if (dto.title !== undefined) task.title = dto.title;
        if (dto.description !== undefined) task.description = dto.description;
        if (dto.status !== undefined) task.status = dto.status as any;
        if (dto.category !== undefined) task.category = dto.category as any;

        // ✅ map DTO order -> DB sortOrder
        if (dto.order !== undefined) task.sortOrder = dto.order;

        const saved = await this.taskRepo.save(task);
        await this.audit(user, 'UPDATE', true, { id });

        return {
            id: saved.id,
            title: saved.title,
            description: saved.description,
            status: saved.status as any,
            category: saved.category as any,
            order: saved.sortOrder,
            organizationId: saved.organization.id,
            createdById: saved.createdBy.id,
            assignedToId: saved.assignedTo?.id ?? null,
            createdAt: saved.createdAt.toISOString(),
            updatedAt: saved.updatedAt.toISOString(),
        };
    }

    async remove(user: JwtPayload, id: string): Promise<{ ok: true }> {
        const role = String(user.role);
        if (roleRank(role) < roleRank('Admin')) {
            await this.audit(user, 'DELETE', false, { reason: 'insufficient_role', id });
            throw new ForbiddenException('Insufficient role');
        }

        const orgIds = await this.getAccessibleOrgIds(user);

        const task = await this.taskRepo.findOne({
            where: { id },
            relations: { organization: true, createdBy: true },
        });
        if (!task) throw new NotFoundException('Task not found');

        if (!orgIds.includes(task.organization.id)) {
            await this.audit(user, 'DELETE', false, { reason: 'org_forbidden', id });
            throw new ForbiddenException('Cannot delete task in that organization');
        }

        await this.taskRepo.delete(id);
        await this.audit(user, 'DELETE', true, { id });

        return { ok: true };
    }
}