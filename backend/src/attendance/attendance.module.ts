import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceSchema } from './schemas/attendance.schema';
import { AttendanceCorrection, AttendanceCorrectionSchema } from './schemas/attendance-correction.schema';
import { AttendanceCron } from './attendance.cron';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: AttendanceCorrection.name, schema: AttendanceCorrectionSchema },
    ])
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceCron]
})
export class AttendanceModule { }
