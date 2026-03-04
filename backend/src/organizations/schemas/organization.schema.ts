import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
    status: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    adminId?: User; // The main admin of the organization (optional initially)
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
