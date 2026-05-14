import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsMongoId,
    IsDateString,
    IsEnum,
    IsNumber,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsMongoId()
    projectId: string;

    @IsOptional()
    @IsMongoId()
    assigneeId?: string;

    @IsOptional()
    @IsDateString()
    deadline?: string;

    @IsOptional()
    @IsEnum(['TODO', 'IN_PROGRESS', 'DONE', 'CLOSED'])
    status?: string;

    @IsOptional()
    @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
    priority?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    estimatedHours?: number;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    plannedEndDate?: string;

    @IsOptional()
    @IsDateString()
    actualEndDate?: string;

    @IsOptional()
    @IsString()
    comments?: string;
}
