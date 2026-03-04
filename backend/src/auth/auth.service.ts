import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(loginDto: LoginDto): Promise<any> {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid credentials or inactive user');
        }

        // Check if organization is inactive or null (skip for SUPERADMIN)
        if (user.role !== 'SUPERADMIN') {
            if (!user.organizationId) {
                throw new UnauthorizedException('User has no associated organization');
            }
            if (user.organizationId.status === 'INACTIVE') {
                throw new UnauthorizedException('Your organization is not active');
            }
        }

        const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return user;
    }

    async login(user: any) {
        const orgId = user.organizationId ? (user.organizationId._id || user.organizationId).toString() : undefined;
        const orgName = user.organizationId ? user.organizationId.name : undefined;

        const payload = {
            email: user.email,
            sub: user._id,
            role: user.role,
            organizationId: orgId,
            organizationName: orgName
        };

        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: '7d',
        });

        await this.usersService.updateRefreshToken(user._id.toString(), refreshToken);

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                organizationId: orgId,
                organizationName: orgName
            }
        };
    }

    async refreshToken(user: any, rt: string) {
        // Basic implementation - in prod, verify if rt matches the stored hash in DB
        const payload = { email: user.email, sub: user._id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
