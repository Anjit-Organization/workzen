import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreateManualNotificationDto } from './dto/create-manual-notification.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
        private usersService: UsersService,
    ) { }

    async create(createDto: CreateNotificationDto): Promise<Notification> {
        const newNotification = new this.notificationModel(createDto);
        return newNotification.save();
    }

    async findByUser(userId: string, organizationId?: string): Promise<Notification[]> {
        const filter: any = { userId };
        if (organizationId) filter.organizationId = organizationId;
        return this.notificationModel.find(filter).sort({ createdAt: -1 }).exec();
    }

    async getUnreadCount(userId: string, organizationId?: string): Promise<number> {
        const filter: any = { userId, read: false };
        if (organizationId) filter.organizationId = organizationId;
        return this.notificationModel.countDocuments(filter).exec();
    }

    async markAsRead(id: string, userId: string, organizationId?: string): Promise<Notification> {
        const filter: any = { _id: id, userId };
        if (organizationId) filter.organizationId = organizationId;

        const notification = await this.notificationModel.findOneAndUpdate(
            filter,
            { read: true },
            { new: true }
        ).exec();

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        return notification;
    }

    async pushManual(dto: CreateManualNotificationDto, organizationId?: string) {
        if (dto.targetUserId === 'all') {
            const users = await this.usersService.findAll(); // May need to scope UsersService.findAll later too
            // Filter users by organization if available
            const filteredUsers = organizationId ? users.filter(u => u.organizationId?.toString() === organizationId) : users;

            const payload = filteredUsers.map(u => ({
                userId: u._id,
                title: dto.title,
                message: dto.message,
                link: dto.link,
                read: false,
                organizationId,
            }));
            await this.notificationModel.insertMany(payload);
            return { message: `Broadcasting notification to ${filteredUsers.length} employees` };
        } else {
            const newNotification = new this.notificationModel({
                userId: dto.targetUserId,
                title: dto.title,
                message: dto.message,
                link: dto.link,
                read: false,
                organizationId,
            });
            await newNotification.save();
            return { message: `Push notification sent to employee successfully` };
        }
    }
}
