import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Leave, LeaveDocument, LeaveStatus, LeaveType } from './schemas/leave.schema';
import { LeaveBalance, LeaveBalanceDocument } from './schemas/leave-balance.schema';
import { ApplyLeaveDto } from './dto/apply-leave.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';

import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';

@Injectable()
export class LeavesService {
    constructor(
        @InjectModel(Leave.name) private leaveModel: Model<LeaveDocument>,
        @InjectModel(LeaveBalance.name) private leaveBalanceModel: Model<LeaveBalanceDocument>,
        @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    ) { }

    async getEmployeeByUserId(userId: string): Promise<EmployeeDocument> {
        const employee = await this.employeeModel.findOne({ userId: userId as any }).exec();
        if (!employee) throw new NotFoundException('Employee profile not found');
        return employee as EmployeeDocument;
    }

    async getBalanceForUser(userId: string): Promise<LeaveBalanceDocument> {
        const employee = await this.getEmployeeByUserId(userId);
        return this.getBalance(employee._id.toString());
    }

    async initializeBalance(employeeId: string): Promise<LeaveBalanceDocument> {
        const existing = await this.leaveBalanceModel.findOne({ employeeId });
        if (existing) return existing;

        const employee = await this.employeeModel.findById(employeeId);

        const newBalance = new this.leaveBalanceModel({
            employeeId,
            casualLeave: employee?.casualLeaveQuota ?? 12,
            sickLeave: employee?.sickLeaveQuota ?? 12,
            privilegeLeave: employee?.privilegeLeaveQuota ?? 15
        });
        return newBalance.save();
    }

    async getBalance(employeeId: string): Promise<LeaveBalanceDocument> {
        let balance: any = await this.leaveBalanceModel.findOne({ employeeId }).exec();
        if (!balance) {
            balance = await this.initializeBalance(employeeId);
        }
        return balance as LeaveBalanceDocument;
    }

    // Employee: Apply for leave
    async applyLeave(userId: string, dto: ApplyLeaveDto, organizationId: string): Promise<Leave> {
        const employee = await this.getEmployeeByUserId(userId);
        const employeeId = employee._id.toString();
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);

        if (startDate > endDate) {
            throw new BadRequestException('Start date cannot be after end date');
        }

        // Rough calculation of days (ignoring weekends/holidays for simplicity in this MVP)
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Validate balance
        const balance = await this.getBalance(employeeId);
        let hasEnoughBalance = false;

        switch (dto.type) {
            case LeaveType.CASUAL:
                hasEnoughBalance = balance.casualLeave >= leaveDays;
                break;
            case LeaveType.SICK:
                hasEnoughBalance = balance.sickLeave >= leaveDays;
                break;
            case LeaveType.PRIVILEGE:
                hasEnoughBalance = balance.privilegeLeave >= leaveDays;
                break;
        }

        if (!hasEnoughBalance) {
            throw new BadRequestException(`Insufficient ${dto.type} leave balance.`);
        }

        const application = new this.leaveModel({
            ...dto,
            employeeId,
            organizationId,
            status: LeaveStatus.PENDING,
        });

        return application.save();
    }

    // Employee/HR: View Leaves
    async findAll(user: any, query: any): Promise<{ data: Leave[], total: number }> {
        const { status, page = 1, limit = 10 } = query;
        const filter: any = {};

        if (user.organizationId) {
            filter.organizationId = user.organizationId;
        }

        let employeeId = query.employeeId;

        if (user.role === 'EMPLOYEE') {
            const employee = await this.getEmployeeByUserId(user.id || user.sub);
            employeeId = employee._id.toString();
        }

        if (employeeId) filter.employeeId = employeeId;
        if (status) filter.status = status;

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.leaveModel.find(filter)
                .populate({ path: 'employeeId', select: 'firstName lastName department' })
                .populate({ path: 'approvedBy', select: 'firstName lastName' }) // HR/Admin who approved
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .exec(),
            this.leaveModel.countDocuments(filter).exec(),
        ]);

        return { data, total };
    }

    // HR/Admin: Approve or Reject leave
    async updateStatus(leaveId: string, statusDto: UpdateLeaveStatusDto, approverId: string): Promise<Leave> {
        const leave = await this.leaveModel.findById(leaveId);
        if (!leave) throw new NotFoundException('Leave application not found');

        if (leave.status !== LeaveStatus.PENDING) {
            throw new BadRequestException(`Leave is already ${leave.status.toLowerCase()}`);
        }

        leave.status = statusDto.status;
        leave.approvedBy = approverId as any;

        if (statusDto.status === LeaveStatus.APPROVED) {
            // Deduct balance
            const startDate = new Date(leave.startDate);
            const endDate = new Date(leave.endDate);
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const balance = await this.getBalance(leave.employeeId);

            switch (leave.type) {
                case LeaveType.CASUAL:
                    balance.casualLeave -= leaveDays;
                    break;
                case LeaveType.SICK:
                    balance.sickLeave -= leaveDays;
                    break;
                case LeaveType.PRIVILEGE:
                    balance.privilegeLeave -= leaveDays;
                    break;
            }
            await balance.save();
        }

        return leave.save();
    }
}
