import { IsNotEmpty, IsString, IsArray, IsOptional, IsMongoId } from 'class-validator';

export class CreateProjectDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    employees?: string[];
}
