import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { Leave, LeaveDocument, LeaveStatus } from '../leaves/schemas/leave.schema';
import { Attendance, AttendanceDocument } from 'src/attendance/schemas/attendance.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class DashboardService {
    constructor(
        @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Leave.name) private leaveModel: Model<LeaveDocument>,
        @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
        @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    ) { }

    async getDashboardStats(organizationId?: string) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        today.setHours(0, 0, 0, 0);

        const empFilter: any = { status: 'ACTIVE' };
        if (organizationId) empFilter.organizationId = organizationId;

        // 1. Total Active Employees
        const activeEmployees = await this.employeeModel.find(empFilter).populate('userId', 'role').exec();
        
        const employeeUserIds = activeEmployees.map(e => (e.userId as any)?._id || e.userId);
        
        // Find users with role HR or MANAGER in this organization who might not have an Employee record
        const additionalUsers = await this.userModel.find({
            organizationId,
            role: { $in: [Role.HR, Role.MANAGER] },
            isActive: true,
            _id: { $nin: employeeUserIds }
        } as any).exec();

        // Convert additionalUsers to a format compatible with activePersonnel mapping
        const virtualPersonnel = additionalUsers.map(u => ({
            _id: u._id, // Fallback to userId
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            department: 'Administration',
            designation: u.role,
            role: u.role,
            userId: u,
            isVirtual: true
        }));

        const activePersonnel = [...activeEmployees, ...virtualPersonnel as any];
        const totalEmployees = activePersonnel.length;

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

        // 3. Present Today - Actual count from attendance records
        const attFilterToday: any = { date: todayStr };
        if (organizationId) attFilterToday.organizationId = organizationId;
        const presentToday = await this.attendanceModel.countDocuments(attFilterToday).exec();

        // 4. Pending Leave Requests
        const pendingLeaveFilter: any = { status: LeaveStatus.PENDING };
        if (organizationId) pendingLeaveFilter.organizationId = organizationId;
        const pendingLeavesCount = await this.leaveModel.countDocuments(pendingLeaveFilter).exec();

        // 5. Recent Leaves
        const recentLeaveFilter: any = {};
        if (organizationId) recentLeaveFilter.organizationId = organizationId;
        const recentLeaves = await this.leaveModel.find(recentLeaveFilter)
            .sort({ createdAt: -1 })
            .populate('employeeId', 'name department')
            .limit(5)
            .exec();

        // 6. Idle Users
        const idleUsers = await Promise.all(activePersonnel.map(async (emp: any) => {
            const activeTasksCount = await this.taskModel.countDocuments({
                assigneeId: emp._id,
                status: { $in: ['TODO', 'IN_PROGRESS'] },
                organizationId
            } as any).exec();

            if (activeTasksCount === 0) {
                return {
                    _id: emp._id,
                    name: emp.name,
                    department: emp.department,
                    designation: emp.designation,
                    role: emp.role || (emp.userId as any)?.role || 'EMPLOYEE'
                };
            }
            return null;
        }));

        const filteredIdleUsers = idleUsers.filter(u => u !== null);

        // 7. Date-wise Attendance Data for the Trailing 7 Working Days (Excluding Weekends)
        const graphData = [];
        let daysToFind = 7;
        let currentOffset = 0;

        while (graphData.length < daysToFind && currentOffset < 30) {
            const d = new Date();
            d.setDate(d.getDate() - currentOffset);
            
            // Normalize to midnight UTC for consistent day-of-week checking
            const dateStr = d.toISOString().split('T')[0];
            const dateObj = new Date(dateStr + 'T00:00:00Z');

            // 0 is Sunday, 6 is Saturday
            const dayOfWeek = dateObj.getUTCDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            if (!isWeekend) {
                const attFilter: any = { date: dateStr };
                if (organizationId) attFilter.organizationId = organizationId;
                const presenceCount = await this.attendanceModel.countDocuments(attFilter).exec();

                graphData.push({
                    name: dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
                    present: presenceCount,
                    absent: Math.max(0, totalEmployees - presenceCount),
                    holiday: 0,
                    isHoliday: false
                });
            }
            currentOffset++;
        }
        const attendanceGraphData = graphData.reverse();

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
            idleUsers: filteredIdleUsers,
            attendanceGraphData
        };
    }


    async getMonthlyAttendance(organizationId: string, month: number, year: number) {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const currentDay = today.getDate();

        const empFilter: any = { status: 'ACTIVE' };
        if (organizationId) empFilter.organizationId = organizationId;

        // 1. Total Active personnel who should be tracked (Employees, HR, Managers)
        const activeEmployees = await this.employeeModel.countDocuments(empFilter).exec();
        
        const employeeUserIds = (await this.employeeModel.find(empFilter).select('userId')).map(e => e.userId);
        
        // Find users with role HR or MANAGER in this organization who might not have an Employee record
        const additionalUsersCount = await this.userModel.countDocuments({
            organizationId,
            role: { $in: [Role.HR, Role.MANAGER] },
            isActive: true,
            _id: { $nin: employeeUserIds }
        } as any).exec();

        const totalEmployees = activeEmployees + additionalUsersCount;

        const daysInMonth = new Date(year, month, 0).getDate();
        let daysToFetch = daysInMonth;

        // If requested month and year is current, truncate at today
        if (year === currentYear && month === currentMonth) {
            daysToFetch = currentDay;
        } else if (year > currentYear || (year === currentYear && month > currentMonth)) {
            // Future months - return empty graph data
            return { graphData: [], totalEmployees: totalEmployees };
        }

        const days = Array.from({ length: daysToFetch }, (_, i) => i + 1);

        const graphData = (await Promise.all(days.map(async (day) => {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const date = new Date(dateStr);
            const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;

            if (isWeekend) return null;

            const attFilter: any = { date: dateStr };
            if (organizationId) attFilter.organizationId = organizationId;
            const presenceCount = await this.attendanceModel.countDocuments(attFilter).exec();
            
            return {
                name: `${day}`,
                present: presenceCount,
                absent: Math.max(0, totalEmployees - presenceCount),
                holiday: 0,
                isHoliday: false
            };
        })));

        return { graphData: graphData.filter(d => d !== null), totalEmployees: totalEmployees };
    }
}
