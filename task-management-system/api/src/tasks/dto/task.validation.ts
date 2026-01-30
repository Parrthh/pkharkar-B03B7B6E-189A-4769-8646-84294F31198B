import { IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, } from 'class-validator';

export class CreateTaskBodyDto {
    @IsString()
    @MaxLength(200)
    title!: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string;

    @IsOptional()
    @IsIn(['Work', 'Personal', 'Other'])
    category?: 'Work' | 'Personal' | 'Other';

    @IsOptional()
    @IsIn(['Todo', 'InProgress', 'Done'])
    status?: 'Todo' | 'InProgress' | 'Done';

    @IsOptional()
    @IsInt()
    @Min(0)
    order?: number;

    @IsOptional()
    @IsUUID()
    organizationId?: string;

    @IsOptional()
    @IsUUID()
    assignedToId?: string;
}

export class UpdateTaskBodyDto {
    @IsOptional()
    @IsString()
    @MaxLength(200)
    title?: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string | null;

    @IsOptional()
    @IsIn(['Work', 'Personal', 'Other'])
    category?: 'Work' | 'Personal' | 'Other';

    @IsOptional()
    @IsIn(['Todo', 'InProgress', 'Done'])
    status?: 'Todo' | 'InProgress' | 'Done';

    @IsOptional()
    @IsInt()
    @Min(0)
    order?: number;

    @IsOptional()
    @IsUUID()
    assignedToId?: string | null;
}