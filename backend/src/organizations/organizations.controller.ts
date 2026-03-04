import { Controller, Post, Body, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
    constructor(private readonly organizationsService: OrganizationsService) { }

    @Post()
    @Roles(Role.SUPERADMIN)
    create(@Body() createDto: CreateOrganizationDto) {
        return this.organizationsService.create(createDto);
    }

    @Get()
    @Roles(Role.SUPERADMIN)
    findAll() {
        return this.organizationsService.findAll();
    }

    @Get(':id/stats')
    @Roles(Role.SUPERADMIN)
    findOneWithStats(@Param('id') id: string) {
        return this.organizationsService.findOneWithStats(id);
    }

    @Patch(':id/toggle-status')
    @Roles(Role.SUPERADMIN)
    toggleStatus(@Param('id') id: string) {
        return this.organizationsService.toggleStatus(id);
    }
}
