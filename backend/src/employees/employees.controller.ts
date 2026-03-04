import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('employees')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EmployeesController {
    constructor(private readonly employeesService: EmployeesService) { }

    @Roles(Role.ADMIN, Role.HR)
    @Post()
    create(@Body() createEmployeeDto: CreateEmployeeDto, @Request() req: any) {
        createEmployeeDto.organizationId = req.user.organizationId;
        createEmployeeDto.organizationName = req.user.organizationName;
        return this.employeesService.create(createEmployeeDto, req.user.id);
    }

    @Get()
    findAll(@Query() query: any, @Request() req: any) {
        return this.employeesService.findAll(query, req.user.organizationId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.employeesService.findOne(id, req.user.organizationId);
    }

    @Get(':id/insights')
    @Roles(Role.ADMIN, Role.HR)
    getInsights(@Param('id') id: string, @Request() req: any) {
        return this.employeesService.getInsights(id, req.user.organizationId);
    }

    @Roles(Role.ADMIN, Role.HR)
    @Patch(':id/mark-salary-paid')
    markSalaryPaid(@Param('id') id: string, @Request() req: any) {
        return this.employeesService.markSalaryPaid(id, req.user.organizationId);
    }

    @Roles(Role.ADMIN, Role.HR)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto, @Request() req: any) {
        return this.employeesService.update(id, updateEmployeeDto, req.user.organizationId);
    }

    @Roles(Role.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.employeesService.remove(id, req.user.organizationId);
    }
}
