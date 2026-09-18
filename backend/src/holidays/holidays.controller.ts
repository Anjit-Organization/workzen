import { Controller, Post, Get, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('holidays')
@UseGuards(JwtAuthGuard)
export class HolidaysController {
    constructor(private readonly holidaysService: HolidaysService) {}

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.HR, Role.MANAGER, Role.ADMIN, Role.SUPERADMIN)
    create(@Body() createHolidayDto: CreateHolidayDto, @Req() req: any) {
        return this.holidaysService.create(createHolidayDto, req.user.organizationId);
    }

    @Get()
    findAll(@Req() req: any) {
        return this.holidaysService.findAll(req.user.organizationId);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.HR, Role.MANAGER, Role.ADMIN, Role.SUPERADMIN)
    remove(@Param('id') id: string, @Req() req: any) {
        return this.holidaysService.remove(id, req.user.organizationId);
    }
}
