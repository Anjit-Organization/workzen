import { Controller, Post, Body, UseGuards, Get, Patch, Delete, Param, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post('hr')
    @Roles(Role.ADMIN)
    async createHR(@Body() createUserDto: CreateUserDto, @Req() req: any) {
        // Enforce the Role to be HR
        createUserDto.role = Role.HR;
        // Bind to parent tenant
        createUserDto.organizationId = req.user.organizationId;
        // In reality we should probably send an email here with the generated password
        return this.usersService.create(createUserDto);
    }

    @Get('hr')
    @Roles(Role.ADMIN)
    async getHRUsers(@Req() req: any) {
        return this.usersService.findHRsByOrg(req.user.organizationId);
    }

    @Patch(':id/reset-password')
    @Roles(Role.SUPERADMIN, Role.ADMIN)
    async resetPassword(@Param('id') id: string) {
        return this.usersService.resetPassword(id);
    }

    @Get()
    @Roles(Role.SUPERADMIN)
    async findAll() {
        return this.usersService.findAll();
    }

    @Patch(':id')
    @Roles(Role.SUPERADMIN)
    async update(@Param('id') id: string, @Body() updateDto: any) {
        return this.usersService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles(Role.SUPERADMIN)
    async remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
