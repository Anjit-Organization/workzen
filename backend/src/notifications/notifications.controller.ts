import { Controller, Get, Put, Param, UseGuards, Req, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateManualNotificationDto } from './dto/create-manual-notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll(@Req() req: any) {
        return this.notificationsService.findByUser(req.user.id, req.user.organizationId);
    }

    @Get('unread-count')
    getUnreadCount(@Req() req: any) {
        return this.notificationsService.getUnreadCount(req.user.id, req.user.organizationId);
    }

    @Put(':id/read')
    markAsRead(@Param('id') id: string, @Req() req: any) {
        return this.notificationsService.markAsRead(id, req.user.id, req.user.organizationId);
    }

    @Post('manual')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.HR)
    pushManualNotification(@Body() dto: CreateManualNotificationDto, @Req() req: any) {
        return this.notificationsService.pushManual(dto, req.user.organizationId);
    }
}
