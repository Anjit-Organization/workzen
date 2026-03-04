import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateManualNotificationDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    message: string;

    @IsString()
    @IsNotEmpty()
    targetUserId: string;

    @IsString()
    @IsOptional()
    link?: string;
}
