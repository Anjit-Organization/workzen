import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { ApplyLeaveDto } from './dto/apply-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('leaves')
@UseGuards(JwtAuthGuard)
export class LeavesController {
    constructor(private readonly leavesService: LeavesService) { }

    @Post('apply')
    applyLeave(
        @Req() req: any,
        @Body() dto: ApplyLeaveDto,
    ) {
        return this.leavesService.applyLeave(req.user.id, dto, req.user.organizationId);
    }

    @Get('balance')
    getBalance(@Req() req: any) {
        return this.leavesService.getBalanceForUser(req.user.id);
    }

    @Get()
    findAll(@Req() req: any, @Query() query: any) {
        return this.leavesService.findAll(req.user, query);
    }

    @Put(':id/status')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.HR) // Only HR/Admin can approve/reject
    updateStatus(
        @Param('id') id: string,
        @Body() statusDto: UpdateLeaveStatusDto,
        @Req() req: any
    ) {
        return this.leavesService.updateStatus(id, statusDto, req.user.id);
    }
}
