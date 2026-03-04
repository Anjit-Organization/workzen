import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ _id: false })
export class PunchRecord {
    @Prop({ required: true })
    punchIn: Date;

    @Prop()
    punchOut?: Date;
}
export const PunchRecordSchema = SchemaFactory.createForClass(PunchRecord);

@Schema({ timestamps: true })
export class Attendance {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: string;

    @Prop({ required: true })
    date: string; // Format: YYYY-MM-DD

    @Prop({ type: [PunchRecordSchema], default: [] })
    records: PunchRecord[];

    @Prop({ default: 0 })
    durationMs?: number; // Accumulated working time in milliseconds for the day

    @Prop({ default: false })
    isAbsent: boolean;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization' })
    organizationId?: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
