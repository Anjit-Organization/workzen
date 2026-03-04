import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum LeaveType {
    CASUAL = 'CASUAL',
    SICK = 'SICK',
    PRIVILEGE = 'PRIVILEGE'
}

export enum LeaveStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export type LeaveDocument = Leave & Document;

@Schema({ timestamps: true })
export class Leave {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Employee', required: true })
    employeeId: string;

    @Prop({ type: String, enum: LeaveType, required: true })
    type: LeaveType;

    @Prop({ required: true })
    startDate: Date;

    @Prop({ required: true })
    endDate: Date;

    @Prop({ required: true })
    reason: string;

    @Prop({ type: String, enum: LeaveStatus, default: LeaveStatus.PENDING })
    status: LeaveStatus;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    approvedBy?: string; // HR/Admin who approved/rejected

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization' })
    organizationId?: string;
}

export const LeaveSchema = SchemaFactory.createForClass(Leave);
