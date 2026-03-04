import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema';
import { AttendanceCorrection, AttendanceCorrectionDocument } from './schemas/attendance-correction.schema';
import { CreateCorrectionDto } from './dto/create-correction.dto';
import { UpdateCorrectionStatusDto } from './dto/update-correction-status.dto';

@Injectable()
export class AttendanceService {
    constructor(
        @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
        @InjectModel(AttendanceCorrection.name) private correctionModel: Model<AttendanceCorrectionDocument>,
    ) { }

    // Utility to get today's date string in YYYY-MM-DD
    private getTodayString(): string {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    async getStatus(userId: string, organizationId?: string) {
        const todayStr = this.getTodayString();
        const filter: any = { userId, date: todayStr };
        if (organizationId) filter.organizationId = organizationId;
        const record = await this.attendanceModel.findOne(filter).exec();

        let isCheckedIn = false;
        let punchInTime = null;
        let punchOutTime = null;

        if (record && record.records && record.records.length > 0) {
            const lastPunch = record.records[record.records.length - 1];
            isCheckedIn = !lastPunch.punchOut;
            punchInTime = lastPunch.punchIn;
            punchOutTime = lastPunch.punchOut || null;
        }

        return {
            isCheckedIn,
            punchInTime,
            punchOutTime,
            durationMs: record?.durationMs || 0
        };
    }

    async punchIn(userId: string, organizationId?: string) {
        const todayStr = this.getTodayString();
        const filter: any = { userId, date: todayStr };
        if (organizationId) filter.organizationId = organizationId;

        const existingRecord = await this.attendanceModel.findOne(filter).exec();
        if (existingRecord) {
            const lastPunch = existingRecord.records[existingRecord.records.length - 1];
            if (lastPunch && !lastPunch.punchOut) {
                throw new BadRequestException('Already punched in today, please punch out first');
            }
            existingRecord.records.push({ punchIn: new Date() });
            return existingRecord.save();
        }

        const newRecord = new this.attendanceModel({
            userId,
            date: todayStr,
            records: [{ punchIn: new Date() }],
            organizationId,
        });

        return newRecord.save();
    }

    async punchOut(userId: string, organizationId?: string) {
        const todayStr = this.getTodayString();
        const filter: any = { userId, date: todayStr };
        if (organizationId) filter.organizationId = organizationId;

        const existingRecord = await this.attendanceModel.findOne(filter).exec();

        if (!existingRecord || !existingRecord.records || existingRecord.records.length === 0) {
            throw new BadRequestException('No punch in record found for today');
        }

        const lastPunch = existingRecord.records[existingRecord.records.length - 1];
        if (lastPunch.punchOut) {
            throw new BadRequestException('Already punched out today');
        }

        const punchOutTime = new Date();
        lastPunch.punchOut = punchOutTime;

        // Recalculate entire durationMs for the day
        let totalDuration = 0;
        for (const r of existingRecord.records) {
            if (r.punchIn && r.punchOut) {
                totalDuration += new Date(r.punchOut).getTime() - new Date(r.punchIn).getTime();
            }
        }
        existingRecord.durationMs = totalDuration;

        return existingRecord.save();
    }

    async getHistory(userId: string, organizationId?: string) {
        const filter: any = { userId };
        if (organizationId) filter.organizationId = organizationId;
        // Just return all for the user sorted chronologically
        return this.attendanceModel.find(filter)
            .sort({ date: -1 })
            .exec();
    }

    async getAll(dateStr?: string, organizationId?: string) {
        const targetDate = dateStr || this.getTodayString();
        const filter: any = { date: targetDate };
        if (organizationId) filter.organizationId = organizationId;
        return this.attendanceModel.find(filter)
            .populate('userId', 'firstName lastName email')
            .exec();
    }

    // --- Corrections ---

    async submitCorrection(userId: string, dto: CreateCorrectionDto, organizationId?: string) {
        // Validate attendance record exists
        const filter: any = { _id: dto.attendanceId, userId };
        if (organizationId) filter.organizationId = organizationId;
        const record = await this.attendanceModel.findOne(filter).exec();
        if (!record) throw new BadRequestException('Attendance record not found for this user');

        const correction = new this.correctionModel({
            userId,
            organizationId,
            ...dto
        });
        return correction.save();
    }

    async getMyCorrections(userId: string, organizationId?: string) {
        const filter: any = { userId };
        if (organizationId) filter.organizationId = organizationId;
        return this.correctionModel.find(filter).sort({ createdAt: -1 }).populate('attendanceId').exec();
    }

    async getAllPendingCorrections(organizationId?: string) {
        const filter: any = { status: 'PENDING' };
        if (organizationId) filter.organizationId = organizationId;
        return this.correctionModel.find(filter)
            .populate('userId', 'firstName lastName email')
            .populate('attendanceId')
            .sort({ createdAt: -1 })
            .exec();
    }

    async resolveCorrection(correctionId: string, dto: UpdateCorrectionStatusDto, organizationId?: string) {
        const filter: any = { _id: correctionId };
        if (organizationId) filter.organizationId = organizationId;
        const correction = await this.correctionModel.findOne(filter).exec();
        if (!correction) throw new BadRequestException('Correction request not found');

        correction.status = dto.status;
        if (dto.hrComments) {
            correction.hrComments = dto.hrComments;
        }

        if (dto.status === 'APPROVED') {
            const attendance = await this.attendanceModel.findById(correction.attendanceId).exec();
            if (attendance) {
                // If it's approved, just push it into records or override entire records list?
                // For simplicity, let's override with exactly what was requested as a single punch for the day.
                attendance.records = [{
                    punchIn: correction.correctedPunchIn,
                    punchOut: correction.correctedPunchOut,
                }];
                attendance.durationMs = new Date(correction.correctedPunchOut).getTime() - new Date(correction.correctedPunchIn).getTime();
                attendance.isAbsent = false;
                await attendance.save();
            }
        }

        return correction.save();
    }
}
