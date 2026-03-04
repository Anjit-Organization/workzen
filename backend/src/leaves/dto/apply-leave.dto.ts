import { IsString, IsNotEmpty, IsDateString, IsEnum } from 'class-validator';
import { LeaveType } from '../schemas/leave.schema';

export class ApplyLeaveDto {
    @IsEnum(LeaveType)
    @IsNotEmpty()
    type: LeaveType;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsDateString()
    @IsNotEmpty()
    endDate: string;

    @IsString()
    @IsNotEmpty()
    reason: string;
}
