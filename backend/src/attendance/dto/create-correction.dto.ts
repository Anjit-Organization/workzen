import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateCorrectionDto {
    @IsString()
    @IsNotEmpty()
    attendanceId: string;

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
