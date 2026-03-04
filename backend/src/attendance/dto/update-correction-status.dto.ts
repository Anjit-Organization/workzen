import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class UpdateCorrectionStatusDto {
    @IsString()
    @IsNotEmpty()
    @IsIn(['APPROVED', 'REJECTED'])
    status: string;

    @IsString()
    @IsOptional()
    hrComments?: string;
}
