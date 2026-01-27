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
    Role,
} from '@org/data';

function roleRank(role: Role): number {
    if (role === 'Owner') return 3;
    if (role === 'Admin') return 2;
    return 1; // Viewer
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

        const myOrgId = user.organizationId;
        if (!me?.organization) return [myOrgId];

        const ids = new Set<string>([me.organization.id]);

        // Admin/Owner can see child orgs too
        if (roleRank(user.role) >= roleRank('Admin')) {
            if (me.organization.children?.length) {
                me.organization.children.forEach((c) => ids.add(c.id));
            }
        }

        return Array.from(ids);
    }

    private async audit(user: JwtPayload, action: string, success: boolean, metadata: any) {
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

    private toDto(t: TaskEntity): TaskDto {
        return {
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status as any,
            category: t.category as any,

            // ✅ DTO expects "order", Entity stores "sortOrder"
            order: t.sortOrder,

            organizationId: t.organization.id,
            createdById: t.createdBy.id,
            assignedToId: t.assignedTo?.id ?? null,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
        };
    }

    async list(user: JwtPayload): Promise<TaskDto[]> {
        const orgIds = await this.getAccessibleOrgIds(user);
        const role = user.role;

        const where =
            role === 'Viewer'
                ? [
                    { organization: { id: In(orgIds) }, assignedTo: { id: user.sub } },
                    { organization: { id: In(orgIds) }, createdBy: { id: user.sub } },
                ]
                : [{ organization: { id: In(orgIds) } }];

        const tasks = await this.taskRepo.find({
            where,
            relations: { organization: true, createdBy: true, assignedTo: true },
            order: { sortOrder: 'ASC', createdAt: 'DESC' }, // ✅ sortOrder
        });

        await this.audit(user, 'LIST', true, { count: tasks.length, orgIds });
        return tasks.map((t) => this.toDto(t));
    }

    async create(user: JwtPayload, dto: CreateTaskDto): Promise<TaskDto> {
        if (roleRank(user.role) < roleRank('Admin')) {
            await this.audit(user, 'CREATE', false, { reason: 'insufficient_role' });
            throw new ForbiddenException('Insufficient role');
        }

        const orgIds = await this.getAccessibleOrgIds(user);
        const targetOrgId = dto.organizationId ?? user.organizationId;

        if (!orgIds.includes(targetOrgId)) {
            await this.audit(user, 'CREATE', false, { reason: 'org_forbidden', targetOrgId });
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
            status: dto.status ?? 'Todo',
            category: dto.category ?? 'Other',

            // ✅ dto.order -> entity.sortOrder
            sortOrder: dto.order ?? 0,

            organization: org,
            createdBy: creator,
            assignedTo: assignedTo ?? null,
        });

        const saved = await this.taskRepo.save(task);
        await this.audit(user, 'CREATE', true, { taskId: saved.id, targetOrgId });

        // reload relations for DTO safety
        const full = await this.taskRepo.findOne({
            where: { id: saved.id },
            relations: { organization: true, createdBy: true, assignedTo: true },
        });

        return this.toDto(full ?? saved);
    }

    async update(user: JwtPayload, id: string, dto: UpdateTaskDto): Promise<TaskDto> {
        if (roleRank(user.role) < roleRank('Admin')) {
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

        // ✅ dto.order -> entity.sortOrder
        if (dto.order !== undefined) task.sortOrder = dto.order;

        const saved = await this.taskRepo.save(task);
        await this.audit(user, 'UPDATE', true, { id });

        return this.toDto(saved);
    }

    async remove(user: JwtPayload, id: string): Promise<{ ok: true }> {
        if (roleRank(user.role) < roleRank('Admin')) {
            await this.audit(user, 'DELETE', false, { reason: 'insufficient_role', id });
            throw new ForbiddenException('Insufficient role');
        }

        const orgIds = await this.getAccessibleOrgIds(user);

        const task = await this.taskRepo.findOne({
            where: { id },
            relations: { organization: true },
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