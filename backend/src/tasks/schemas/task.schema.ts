import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Employee } from '../../employees/schemas/employee.schema';
import { Project } from '../../projects/schemas/project.schema';
import { Organization } from '../../organizations/schemas/organization.schema';
import { User } from '../../users/schemas/user.schema';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true })
    projectId: Project;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
    organizationId: Organization;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Employee' })
    assigneeId: Employee;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    createdBy: User;

    @Prop({ required: true, enum: ['TODO', 'IN_PROGRESS', 'DONE', 'CLOSED'], default: 'TODO' })
    status: string;

    @Prop()
    deadline: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
