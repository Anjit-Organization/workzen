import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    passwordHash: string;

    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop({ type: String, enum: Role, default: Role.EMPLOYEE })
    role: Role;

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    refreshToken?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization' })
    organizationId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Ensure an email is unique only within a specific organization (or globally if no org, like SuperAdmin)
UserSchema.index({ email: 1, organizationId: 1 }, { unique: true });
