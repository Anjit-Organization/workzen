import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from './schemas/organization.schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UsersService } from '../users/users.service';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class OrganizationsService {
    constructor(
        @InjectModel(Organization.name) private organizationModel: Model<OrganizationDocument>,
        @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
        private usersService: UsersService,
    ) { }

    async create(createDto: CreateOrganizationDto): Promise<Organization> {
        const existingOrg = await this.organizationModel.findOne({ name: createDto.name });
        if (existingOrg) {
            throw new ConflictException('Organization name already exists');
        }

        // 1. Create Organization
        const org = new this.organizationModel({
            name: createDto.name,
            status: 'ACTIVE'
        });
        const savedOrg = await org.save();

        // 2. Create Admin User for this organization
        // Note: we need to pass organizationId to UsersService eventually
        const adminUser = await this.usersService.create({
            email: createDto.adminEmail,
            passwordHash: 'Welcome@123', // Default password
            firstName: createDto.adminFirstName,
            lastName: createDto.adminLastName,
            role: Role.ADMIN,
            organizationId: savedOrg._id as any
        });

        // 3. Update organization with adminId
        savedOrg.adminId = adminUser as any;
        await savedOrg.save();

        return savedOrg;
    }

    async findOneWithStats(id: string) {
        const org = await this.organizationModel.findById(id).populate('adminId', 'firstName lastName email role').exec();
        if (!org) throw new NotFoundException('Organization not found');

        // Get total employees
        const totalEmployees = await this.employeeModel.countDocuments({ organizationId: id });
        const activeEmployees = await this.employeeModel.countDocuments({ organizationId: id, status: 'ACTIVE' });

        // Get total HR/Admins
        const users = await this.usersService.findAllByOrg(id);

        return {
            organization: org,
            stats: {
                totalEmployees,
                activeEmployees,
                inactiveEmployees: totalEmployees - activeEmployees,
                totalUsers: users.length
            },
            users
        };
    }

    async findAll() {
        return this.organizationModel.find().populate('adminId', 'firstName lastName email').exec();
    }

    async toggleStatus(id: string) {
        const org = await this.organizationModel.findById(id);
        if (!org) {
            throw new NotFoundException('Organization not found');
        }
        org.status = org.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        return org.save();
    }
}
