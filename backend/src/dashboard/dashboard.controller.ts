import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    @Roles(Role.ADMIN, Role.HR)
    getStats(@Req() req: any) {
        return this.dashboardService.getDashboardStats(req.user.organizationId);
    }

    @Get('monthly-attendance')
    @Roles(Role.ADMIN, Role.HR)
    getMonthlyAttendance(
        @Req() req: any,
        @Query('month') month: string,
        @Query('year') year: string,
    ) {
        const now = new Date();
        return this.dashboardService.getMonthlyAttendance(
            req.user.organizationId,
            parseInt(month) || (now.getMonth() + 1),
            parseInt(year) || now.getFullYear(),
        );
    }
}
