import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type LeaveBalanceDocument = LeaveBalance & Document;

@Schema({ timestamps: true })
export class LeaveBalance {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Employee', required: true, unique: true })
    employeeId: string;

    @Prop({ default: 12 }) // Default 12 Casual Leaves per year
    casualLeave: number;

    @Prop({ default: 12 }) // Default 12 Sick Leaves per year
    sickLeave: number;

    @Prop({ default: 15 }) // Default 15 Privilege Leaves per year
    privilegeLeave: number;
}

export const LeaveBalanceSchema = SchemaFactory.createForClass(LeaveBalance);
