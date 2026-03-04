import { Controller, Post, Get, UseGuards, Req, Query, Body, Patch, Param } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateCorrectionDto } from './dto/create-correction.dto';
import { UpdateCorrectionStatusDto } from './dto/update-correction-status.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) { }

    @Get('status')
    getStatus(@Req() req: any) {
        return this.attendanceService.getStatus(req.user.id, req.user.organizationId);
    }

    @Post('punch-in')
    punchIn(@Req() req: any) {
        return this.attendanceService.punchIn(req.user.id, req.user.organizationId);
    }

    @Post('punch-out')
    punchOut(@Req() req: any) {
        return this.attendanceService.punchOut(req.user.id, req.user.organizationId);
    }

    @Get('history')
    getHistory(@Req() req: any) {
        return this.attendanceService.getHistory(req.user.id, req.user.organizationId);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.HR)
    getAll(@Query('date') date: string, @Req() req: any) {
        return this.attendanceService.getAll(date, req.user.organizationId);
    }

    // --- Corrections ---

    @Post('correction')
    submitCorrection(@Req() req: any, @Body() dto: CreateCorrectionDto) {
        return this.attendanceService.submitCorrection(req.user.id, dto, req.user.organizationId);
    }

    @Get('correction')
    getMyCorrections(@Req() req: any) {
        return this.attendanceService.getMyCorrections(req.user.id, req.user.organizationId);
    }

    @Get('correction/all')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.HR)
    getAllPendingCorrections(@Req() req: any) {
        return this.attendanceService.getAllPendingCorrections(req.user.organizationId);
    }

    @Patch('correction/:id/resolve')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.HR)
    resolveCorrection(@Param('id') id: string, @Body() dto: UpdateCorrectionStatusDto, @Req() req: any) {
        return this.attendanceService.resolveCorrection(id, dto, req.user.organizationId);
    }
}
