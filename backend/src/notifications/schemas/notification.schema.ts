import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: string; // The user who receives the notification

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    @Prop({ default: false })
    read: boolean;

    @Prop({ type: String })
    link?: string; // Optional deep link to click on

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization' })
    organizationId?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
