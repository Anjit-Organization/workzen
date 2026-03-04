import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema';

@Injectable()
export class AttendanceCron {
    private readonly logger = new Logger(AttendanceCron.name);

    constructor(
        @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    ) { }

    // Run every day at 11:59 PM
    @Cron('59 23 * * *')
    async handleDailyAttendance() {
        this.logger.debug('Running daily attendance check to mark missing punch-outs as absent');

        // Note: this assumes standard server timezone aligns with business timezone, in production
        // we would use a library like luxon to align with a specific timezone.
        const todayStr = new Date().toISOString().split('T')[0];

        try {
            // Find all attendance records for today
            const todayRecords = await this.attendanceModel.find({ date: todayStr }).exec();

            let markedAbsentCount = 0;

            for (const record of todayRecords) {
                if (!record.records || record.records.length === 0) {
                    record.isAbsent = true;
                    await record.save();
                    markedAbsentCount++;
                    continue;
                }

                const lastPunch = record.records[record.records.length - 1];
                if (!lastPunch.punchOut) {
                    // Punched in, but no punch out before 11:59 PM
                    record.isAbsent = true;
                    await record.save();
                    markedAbsentCount++;
                }
            }

            this.logger.debug(`Found and marked ${markedAbsentCount} incomplete/missing attendances as absent today.`);
        } catch (error) {
            this.logger.error('Failed to process daily attendance cron', error);
        }
    }
}
