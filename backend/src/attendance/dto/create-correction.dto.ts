import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateCorrectionDto {
    @IsString()
    @IsOptional()
    attendanceId?: string;

    @IsString()
    @IsNotEmpty()
    date: string;

    @IsString()
    @IsNotEmpty()
    reason: string;

    @IsDateString()
    @IsNotEmpty()
    correctedPunchIn: string;

    @IsDateString()
    @IsNotEmpty()
    correctedPunchOut: string;
}
