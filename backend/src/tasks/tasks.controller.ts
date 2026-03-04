import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    create(@Body() createTaskDto: CreateTaskDto, @Request() req: any) {
        return this.tasksService.create(createTaskDto, req.user.id, req.user.organizationId);
    }

    @Get()
    findAll(@Query('projectId') projectId: string, @Query('userId') userId: string, @Query('status') status: string, @Request() req: any) {
        // If employee, limit their view in the service
        const filterUserId = req.user.role === 'EMPLOYEE' ? req.user.id : userId;
        return this.tasksService.findAll(req.user.organizationId, projectId, filterUserId, status, req.user.role);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.tasksService.findOne(id, req.user.organizationId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req: any) {
        return this.tasksService.update(id, updateTaskDto, req.user.organizationId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.tasksService.remove(id, req.user.organizationId);
    }
}
