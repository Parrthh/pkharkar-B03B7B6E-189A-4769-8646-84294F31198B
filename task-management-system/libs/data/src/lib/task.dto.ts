export type TaskStatus = 'Todo' | 'InProgress' | 'Done';
export type TaskCategory = 'Work' | 'Personal' | 'Other';

export interface TaskDto {
    id: string;
    title: string;
    description?: string | null;
    status: TaskStatus;
    category: TaskCategory;
    order: number;

    organizationId: string;
    createdById: string;
    assignedToId?: string | null;

    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskDto {
    title: string;
    description?: string;
    category?: TaskCategory;
    status?: TaskStatus;
    order?: number;
    organizationId?: string;
    assignedToId?: string;
}

export interface UpdateTaskDto {
    title?: string;
    description?: string | null;
    category?: TaskCategory;
    status?: TaskStatus;
    order?: number;
    assignedToId?: string | null;
}