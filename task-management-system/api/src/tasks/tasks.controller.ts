import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// We will use these from libs/auth
import { RbacGuard, Roles } from '@org/auth';

import type { CreateTaskDto, UpdateTaskDto, JwtPayload } from '@org/data';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RbacGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Get()
    @Roles('Viewer', 'Admin', 'Owner')
    list(@Req() req: { user: JwtPayload }) {
        return this.tasksService.list(req.user);
    }

    @Post()
    @Roles('Admin', 'Owner')
    create(@Req() req: { user: JwtPayload }, @Body() dto: CreateTaskDto) {
        return this.tasksService.create(req.user, dto);
    }

    @Put(':id')
    @Roles('Admin', 'Owner')
    update(@Req() req: { user: JwtPayload }, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
        return this.tasksService.update(req.user, id, dto);
    }

    @Delete(':id')
    @Roles('Admin', 'Owner')
    remove(@Req() req: { user: JwtPayload }, @Param('id') id: string) {
        return this.tasksService.remove(req.user, id);
    }
}