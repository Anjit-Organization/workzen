import { IsEmail, IsNotEmpty, IsOptional, IsString, IsDateString, IsEnum, IsNumber, Matches } from 'class-validator';

export class CreateEmployeeDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-zA-Z\s]+$/, { message: 'Name must contain only alphabets and spaces' })
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    department: string;

    @IsString()
    @IsNotEmpty()
    designation: string;

    @IsDateString()
    joiningDate: string;

    @IsOptional()
    @IsNumber()
    payroll?: number;

    @IsOptional()
    @IsNumber()
    salaryDate?: number;

    @IsOptional()
    @IsNumber()
    casualLeaveQuota?: number;

    @IsOptional()
    @IsNumber()
    sickLeaveQuota?: number;

    @IsOptional()
    @IsNumber()
    privilegeLeaveQuota?: number;

    @IsOptional()
    @IsEnum(['ACTIVE', 'INACTIVE', 'TERMINATED'])
    status?: string;

    @IsOptional()
    @IsString()
    organizationId?: string;

    @IsOptional()
    @IsString()
    organizationName?: string;
}
