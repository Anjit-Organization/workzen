import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreateOrganizationDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    adminFirstName: string;

    @IsString()
    @IsNotEmpty()
    adminLastName: string;

    @IsEmail()
    @IsNotEmpty()
    adminEmail: string;
}
