import { IsNotEmpty, IsString, IsOptional, IsMongoId, IsDateString, IsEnum } from 'class-validator';

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
    @IsEnum(['TODO', 'IN_PROGRESS', 'DONE'])
    status?: string;
}
