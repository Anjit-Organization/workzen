import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
    @Post()
    create(@Body() createProjectDto: CreateProjectDto, @Request() req: any) {
        return this.projectsService.create(createProjectDto, req.user.id, req.user.organizationId);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.projectsService.findAll(req.user.organizationId, req.user.id, req.user.role);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.projectsService.findOne(id, req.user.organizationId);
    }

    @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Request() req: any) {
        return this.projectsService.update(id, updateProjectDto, req.user.organizationId);
    }

    @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.projectsService.remove(id, req.user.organizationId);
    }
}
