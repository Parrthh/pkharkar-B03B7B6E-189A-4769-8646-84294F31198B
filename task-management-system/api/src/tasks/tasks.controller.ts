import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Req,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, Roles } from '@org/auth';

import type { JwtPayload } from '@org/data';
import { TasksService } from './tasks.service';

// ✅ Validation DTO classes (runtime validation)
import {
    CreateTaskBodyDto,
    UpdateTaskBodyDto,
} from './dto/task.validation';

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
    create(
        @Req() req: { user: JwtPayload },
        @Body() dto: CreateTaskBodyDto,
    ) {
        // dto is validated already by ValidationPipe
        return this.tasksService.create(req.user, dto);
    }

    @Put(':id')
    @Roles('Admin', 'Owner')
    update(
        @Req() req: { user: JwtPayload },
        @Param('id') id: string,
        @Body() dto: UpdateTaskBodyDto,
    ) {
        return this.tasksService.update(req.user, id, dto);
    }

    @Delete(':id')
    @Roles('Admin', 'Owner')
    remove(@Req() req: { user: JwtPayload }, @Param('id') id: string) {
        return this.tasksService.remove(req.user, id);
    }
}