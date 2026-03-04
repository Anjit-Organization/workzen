import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { Leave, LeaveDocument, LeaveStatus } from '../leaves/schemas/leave.schema';
import { Attendance, AttendanceDocument } from 'src/attendance/schemas/attendance.schema';

@Injectable()
export class DashboardService {
    constructor(
        @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
        @InjectModel(Leave.name) private leaveModel: Model<LeaveDocument>,
        @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    ) { }

    async getDashboardStats(organizationId?: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const empFilter: any = { status: 'ACTIVE' };
        if (organizationId) empFilter.organizationId = organizationId;

        // 1. Total Active Employees & Monthly Salary Cost
        const activeEmployees = await this.employeeModel.find(empFilter).exec();
        const totalEmployees = activeEmployees.length;

        // Calculate Monthly Salary Cost
        const monthlySalaryCost = activeEmployees.reduce((sum, emp) => sum + (emp.payroll || 0), 0);

        // 2. Employees on Leave Today
        const leaveTodayFilter: any = {
            status: LeaveStatus.APPROVED,
            startDate: { $lte: today },
            endDate: { $gte: today }
        };
        if (organizationId) leaveTodayFilter.organizationId = organizationId;

        const leavesToday = await this.leaveModel.find(leaveTodayFilter).exec();

        const totalOnLeaveToday = leavesToday.length;

        // 3. Present Today (Rough Estimate = Total - On Leave)
        const presentToday = totalEmployees - totalOnLeaveToday;

        // 4. Pending Leave Requests (For HR/Admin attention)
        const pendingLeaveFilter: any = { status: LeaveStatus.PENDING };
        if (organizationId) pendingLeaveFilter.organizationId = organizationId;
        const pendingLeavesCount = await this.leaveModel.countDocuments(pendingLeaveFilter).exec();

        // 5. Recent Leaves (List of 5 latest approved/pending leaves for timeline)
        const recentLeaveFilter: any = {};
        if (organizationId) recentLeaveFilter.organizationId = organizationId;
        const recentLeaves = await this.leaveModel.find(recentLeaveFilter)
            .sort({ createdAt: -1 })
            .populate('employeeId', 'firstName lastName department')
            .limit(5)
            .exec();

        // 6. Date-wise Attendance Data for the Trailing 7 Days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const attendanceGraphData = await Promise.all(last7Days.map(async (dateStr) => {
            const attFilter: any = { date: dateStr };
            if (organizationId) attFilter.organizationId = organizationId;
            const presenceCount = await this.attendanceModel.countDocuments(attFilter).exec();

            // Format Day X mapping
            return {
                name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
                present: presenceCount,
                absent: totalEmployees - presenceCount
            };
        }));

        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const currentDay = today.getDate();

        const pendingSalaries = activeEmployees.filter(emp => {
            if (currentDay >= (emp.salaryDate || 1)) {
                if (!emp.lastSalaryPaidDate) return true;
                const paidDate = new Date(emp.lastSalaryPaidDate);
                if (paidDate.getMonth() !== currentMonth || paidDate.getFullYear() !== currentYear) {
                    return true;
                }
            }
            return false;
        }).map(emp => ({
            _id: emp._id,
            name: emp.name,
            department: emp.department,
            payroll: emp.payroll,
            salaryDate: emp.salaryDate || 1
        }));

        return {
            totalEmployees,
            presentToday,
            totalOnLeaveToday,
            monthlySalaryCost,
            pendingLeavesCount,
            recentLeaves,
            pendingSalaries,
            attendanceGraphData
        };
    }
}
