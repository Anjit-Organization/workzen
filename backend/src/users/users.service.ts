import { Injectable, OnModuleInit, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Role } from '../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private configService: ConfigService
    ) { }

    async onModuleInit() {
        await this.seedAdmin();
        await this.seedSuperAdmin();
    }

    private async seedAdmin() {
        const adminExists = await this.userModel.findOne({ role: Role.ADMIN });
        if (!adminExists) {
            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash('Admin@123', salt);

            await this.userModel.create({
                email: 'admin@hrms.com',
                firstName: 'System',
                lastName: 'Admin',
                passwordHash,
                role: Role.ADMIN,
            });
            console.log('Default Admin created: admin@hrms.com / Admin@123');
        }
    }

    private async seedSuperAdmin() {
        const superAdminExists = await this.userModel.findOne({ role: Role.SUPERADMIN });
        if (!superAdminExists) {
            const email = this.configService.get<string>('SUPERADMIN_EMAIL') || 'superadmin@hrms.com';
            const password = this.configService.get<string>('SUPERADMIN_PASSWORD') || 'SuperAdmin@123';
            const firstName = this.configService.get<string>('SUPERADMIN_FIRSTNAME') || 'Super';
            const lastName = this.configService.get<string>('SUPERADMIN_LASTNAME') || 'Admin';

            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash(password, salt);

            await this.userModel.create({
                email,
                firstName,
                lastName,
                passwordHash,
                role: Role.SUPERADMIN,
            });
            console.log(`Default SuperAdmin created: ${email}`);
        }
    }

    async create(createUserDto: CreateUserDto): Promise<UserDocument> {
        const { email, passwordHash, ...rest } = createUserDto;

        const existingUser = await this.userModel.findOne({ email, organizationId: rest.organizationId });
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(passwordHash, salt);

        const newUser = new this.userModel({
            ...rest,
            email,
            passwordHash: hashed,
        });

        return newUser.save();
    }

    async findByEmail(email: string): Promise<any | null> {
        return this.userModel.findOne({ email }).populate('organizationId').exec();
    }

    async findById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }

    async findAll(): Promise<UserDocument[]> {
        return this.userModel.find().populate('organizationId', 'name').select('-passwordHash').exec();
    }

    async findByRole(role: Role): Promise<UserDocument[]> {
        return this.userModel.find({ role }).select('-passwordHash').exec();
    }

    async findHRsByOrg(organizationId: string): Promise<UserDocument[]> {
        return this.userModel.find({ role: Role.HR, organizationId }).select('-passwordHash').exec();
    }

    async updateRefreshToken(userId: string, refreshToken: string) {
        // Simple hash for refresh token in DB
        const hashedRt = await bcrypt.hash(refreshToken, 10);
        await this.userModel.findByIdAndUpdate(userId, { refreshToken: hashedRt });
    }

    async findAllByOrg(organizationId: string): Promise<User[]> {
        return this.userModel.find({ organizationId }).select('-passwordHash').exec();
    }

    async resetPassword(userId: string): Promise<{ message: string }> {
        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        const newPasswordHash = await bcrypt.hash('Welcome@123', 10);
        user.passwordHash = newPasswordHash;
        await user.save();

        return { message: 'Password reset to Welcome@123 successfully' };
    }

    async update(id: string, updateDto: any): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    }

    async remove(id: string): Promise<UserDocument | null> {
        return this.userModel.findByIdAndDelete(id).exec();
    }
}
