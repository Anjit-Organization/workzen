import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type EmployeeDocument = Employee & Document;

@Schema({ timestamps: true })
export class Employee {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: true })
    department: string;

    @Prop({ required: true })
    designation: string;

    @Prop({ required: true })
    joiningDate: Date;

    @Prop({ default: 0 })
    payroll: number;

    @Prop({ default: 1, min: 1, max: 31 })
    salaryDate: number;

    @Prop()
    lastSalaryPaidDate?: Date;

    @Prop({ default: 12 })
    casualLeaveQuota: number;

    @Prop({ default: 12 })
    sickLeaveQuota: number;

    @Prop({ default: 15 })
    privilegeLeaveQuota: number;

    @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'TERMINATED'] })
    status: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    userId: User;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization' })
    organizationId?: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

// Ensure an email is unique only within a specific organization
EmployeeSchema.index({ email: 1, organizationId: 1 }, { unique: true });
