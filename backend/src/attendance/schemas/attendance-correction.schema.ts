import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AttendanceCorrectionDocument = AttendanceCorrection & Document;

@Schema({ timestamps: true })
export class AttendanceCorrection {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Attendance', required: true })
    attendanceId: string;

    @Prop({ required: true })
    date: string; // YYYY-MM-DD

    @Prop({ required: true })
    reason: string;

    @Prop({ required: true })
    correctedPunchIn: Date;

    @Prop({ required: true })
    correctedPunchOut: Date;

    @Prop({ enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' })
    status: string;

    @Prop()
    hrComments?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization' })
    organizationId?: string;
}

export const AttendanceCorrectionSchema = SchemaFactory.createForClass(AttendanceCorrection);
