// api/src/tasks/tasks.service.spec.ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';

import { TasksService } from './tasks.service';
import { TaskEntity } from '../entities/task.entity';
import { OrganizationEntity } from '../entities/organization.entity';
import { UserEntity } from '../entities/user.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';

import type { JwtPayload, CreateTaskDto } from '@org/data';

// Minimal repo mock type (avoids Repository<T> typing headaches)
type RepoMock<T> = {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
};

function repoMock<T>(): RepoMock<T> {
    return {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn((x) => x),
        delete: jest.fn(),
        count: jest.fn(),
    };
}

describe('TasksService', () => {
    let service: TasksService;

    const taskRepo = repoMock<TaskEntity>();
    const orgRepo = repoMock<OrganizationEntity>();
    const userRepo = repoMock<UserEntity>();
    const auditRepo = repoMock<AuditLogEntity>();

    const adminUser: JwtPayload = {
        sub: 'admin-user-id',
        email: 'admin@example.com',
        role: 'Admin' as any,
        organizationId: 'org-1',
    };

    const viewerUser: JwtPayload = {
        sub: 'viewer-user-id',
        email: 'viewer@example.com',
        role: 'Viewer' as any,
        organizationId: 'org-1',
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const moduleRef = await Test.createTestingModule({
            providers: [
                TasksService,
                { provide: getRepositoryToken(TaskEntity), useValue: taskRepo as any },
                { provide: getRepositoryToken(OrganizationEntity), useValue: orgRepo as any },
                { provide: getRepositoryToken(UserEntity), useValue: userRepo as any },
                { provide: getRepositoryToken(AuditLogEntity), useValue: auditRepo as any },
            ],
        }).compile();

        service = moduleRef.get(TasksService);
    });

    it('Viewer cannot create a task (403)', async () => {
        const dto: CreateTaskDto = { title: 'Should fail' } as any;

        await expect(service.create(viewerUser, dto)).rejects.toBeInstanceOf(
            ForbiddenException
        );

        expect(auditRepo.save).toHaveBeenCalled();
    });

    it('Admin can create a task', async () => {
        // 1st call: getAccessibleOrgIds() -> load me + org children
        userRepo.findOne = jest
            .fn()
            .mockResolvedValueOnce({
                id: adminUser.sub,
                organization: { id: adminUser.organizationId, children: [] },
            })
            // 2nd call: creator lookup
            .mockResolvedValueOnce({
                id: adminUser.sub,
            });

        orgRepo.findOne = jest.fn().mockResolvedValue({
            id: adminUser.organizationId,
        });

        taskRepo.save = jest.fn().mockResolvedValue({
            id: 'task-1',
            title: 'First task',
            description: 'hello',
            status: 'Todo',
            category: 'Work',
            sortOrder: 1, // entity uses sortOrder
            organization: { id: adminUser.organizationId },
            createdBy: { id: adminUser.sub },
            assignedTo: null,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        });

        const dto: CreateTaskDto = {
            title: 'First task',
            description: 'hello',
            status: 'Todo',
            category: 'Work',
            order: 1, // dto uses order
        } as any;

        const result = await service.create(adminUser, dto);

        expect(result.id).toBe('task-1');
        expect(result.title).toBe('First task');
        expect(result.order).toBe(1); // service should map sortOrder -> order
        expect(auditRepo.save).toHaveBeenCalled();
    });
});