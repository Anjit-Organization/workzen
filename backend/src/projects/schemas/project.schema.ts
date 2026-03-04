import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Employee } from '../../employees/schemas/employee.schema';
import { Organization } from '../../organizations/schemas/organization.schema';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
    organizationId: Organization;

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Employee' }] })
    employees: Employee[];

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    createdBy: User;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
