import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type HolidayDocument = Holiday & Document;

@Schema({ timestamps: true })
export class Holiday {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    date: string; // YYYY-MM-DD format

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization' })
    organizationId?: string;
}

export const HolidaySchema = SchemaFactory.createForClass(Holiday);
