import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Holiday, HolidayDocument } from './schemas/holiday.schema';
import { CreateHolidayDto } from './dto/create-holiday.dto';

@Injectable()
export class HolidaysService {
    constructor(@InjectModel(Holiday.name) private holidayModel: Model<HolidayDocument>) {}

    async create(createHolidayDto: CreateHolidayDto, organizationId: string): Promise<Holiday> {
        const newHoliday = new this.holidayModel({
            ...createHolidayDto,
            organizationId,
        });
        return newHoliday.save();
    }

    async findAll(organizationId: string): Promise<Holiday[]> {
        return this.holidayModel.find({ organizationId }).sort({ date: 1 }).exec();
    }

    async remove(id: string, organizationId: string): Promise<void> {
        const result = await this.holidayModel.deleteOne({ _id: id, organizationId }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException('Holiday not found or you do not have permission to delete it');
        }
    }
}
