import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument } from './schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';
import { Leave, LeaveDocument } from '../leaves/schemas/leave.schema';
import { Attendance, AttendanceDocument } from '../attendance/schemas/attendance.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';

import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class EmployeesService {
    constructor(
        @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Leave.name) private leaveModel: Model<LeaveDocument>,
        @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
        private usersService: UsersService,
    ) { }

    async create(createEmployeeDto: CreateEmployeeDto, adminUserId: string): Promise<Employee> {
        const existingEmployee = await this.employeeModel.findOne({ email: createEmployeeDto.email, organizationId: createEmployeeDto.organizationId });
        if (existingEmployee) {
            throw new ConflictException('Employee with this email already exists');
        }

        const nameParts = createEmployeeDto.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        const createdUser = await this.usersService.create({
            email: createEmployeeDto.email,
            passwordHash: 'Welcome@123',
            firstName,
            lastName,
            role: createEmployeeDto.role || Role.EMPLOYEE,
            organizationId: createEmployeeDto.organizationId
        });


        // Generate Employee ID
        let employeeId = 'EMP0001';
        if (createEmployeeDto.organizationId && createEmployeeDto.organizationName) {
            const orgPrefix = createEmployeeDto.organizationName.substring(0, 3).toUpperCase();
            const count = await this.employeeModel.countDocuments({ organizationId: createEmployeeDto.organizationId });
            const nextSequence = String(count + 1).padStart(4, '0');
            employeeId = `${orgPrefix}${nextSequence}`;
        }

        const createdEmployee = new this.employeeModel({
            ...createEmployeeDto,
            employeeId,
            userId: createdUser._id,
        });
        return createdEmployee.save();
    }

    async findAll(query: any, organizationId: string): Promise<{ data: Employee[]; total: number }> {
        const { search, page = 1, limit = 10 } = query;
        const filter: any = { status: { $ne: 'TERMINATED' } }; // Soft delete
        if (organizationId) {
            filter.organizationId = organizationId;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.employeeModel.find(filter).populate('userId', 'firstName lastName email').skip(skip).limit(Number(limit)).exec(),
            this.employeeModel.countDocuments(filter).exec(),
        ]);

        // For administrative lists (like dropdowns), include HR and Managers who aren't in Employee collection
        if (!search) {
             const employeeUserIds = data.map(e => (e.userId as any)?._id || e.userId);
             const additionalUsers = await this.userModel.find({
                organizationId,
                role: { $in: [Role.HR, Role.MANAGER] },
                isActive: true,
                _id: { $nin: employeeUserIds }
            } as any).exec();
            
            const virtualEmployees = additionalUsers.map(u => ({
                _id: u._id,
                name: `${u.firstName} ${u.lastName}`,
                email: u.email,
                department: 'Administration',
                designation: u.role,
                status: 'ACTIVE',
                userId: u,
                isVirtual: true
            }));
            
            return { 
                data: [...data, ...virtualEmployees as any].slice(0, Number(limit)), 
                total: total + virtualEmployees.length 
            };
        }

        return { data, total };
    }

    async findOne(id: string, organizationId: string): Promise<any> {
        const filter: any = { _id: id };
        if (organizationId) filter.organizationId = organizationId;

        let employee: any = await this.employeeModel.findOne(filter).populate('userId', 'firstName lastName email').exec();
        
        // Fallback for virtual employees (Admin/Manager/HR)
        if (!employee) {
            const user = await this.userModel.findOne({ _id: id, organizationId, role: { $in: [Role.HR, Role.MANAGER, Role.ADMIN] } }).exec();
            if (user) {
                return {
                    _id: user._id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    department: 'Administration',
                    designation: user.role,
                    status: 'ACTIVE',
                    userId: user,
                    isVirtual: true
                };
            }
        }

        if (!employee || employee.status === 'TERMINATED') {
            throw new NotFoundException(`Employee #${id} not found`);
        }
        return employee;
    }

    async getInsights(id: string, organizationId: string) {
        const employee = await this.findOne(id, organizationId);
        const actualUserId = employee.isVirtual ? employee.userId._id : employee.userId?._id || employee.userId;

        // Current month filters
        const startOfMonthDate = new Date();
        startOfMonthDate.setDate(1);
        startOfMonthDate.setHours(0, 0, 0, 0);
        const currentMonthStr = `${startOfMonthDate.getFullYear()}-${String(startOfMonthDate.getMonth() + 1).padStart(2, '0')}`;

        // Fetch Leave History
        const leaves = await this.leaveModel.find({ 
            employeeId: id, 
            organizationId,
            startDate: { $gte: startOfMonthDate }
        }).sort({ createdAt: -1 }).exec();

        // Fetch Attendance History
        const attendance = await this.attendanceModel.find({ 
            userId: actualUserId, 
            organizationId,
            date: { $gte: `${currentMonthStr}-01`, $lte: `${currentMonthStr}-31` }
        })
            .sort({ date: -1 })
            .exec();

        // Fetch Assigned Projects
        const projectFilter: any = { employees: id, organizationId };
        const projects = await this.projectModel.find(projectFilter).exec();

        // Fetch Assigned Tasks
        const taskFilter: any = { assigneeId: id, organizationId };
        const tasks = await this.taskModel.find(taskFilter).populate('projectId', 'name').exec();

        return {
            employee,
            leaves,
            attendance,
            projects,
            tasks
        };
    }

    async update(id: string, updateEmployeeDto: UpdateEmployeeDto, organizationId: string): Promise<Employee> {
        const filter: any = { _id: id };
        if (organizationId) filter.organizationId = organizationId;

        const existingEmployee = await this.employeeModel
            .findOneAndUpdate(filter, updateEmployeeDto, { new: true })
            .exec();

        if (!existingEmployee) {
            throw new NotFoundException(`Employee #${id} not found`);
        }
        return existingEmployee;
    }

    async remove(id: string, organizationId: string): Promise<Employee> {
        const filter: any = { _id: id };
        if (organizationId) filter.organizationId = organizationId;

        const employee = await this.employeeModel.findOneAndUpdate(
            filter,
            { status: 'TERMINATED' },
            { new: true }
        ).exec();

        if (!employee) {
            throw new NotFoundException(`Employee #${id} not found`);
        }
        return employee;
    }

    async markSalaryPaid(id: string, organizationId: string): Promise<Employee> {
        const filter: any = { _id: id };
        if (organizationId) filter.organizationId = organizationId;

        const employee = await this.employeeModel.findOneAndUpdate(
            filter,
            { lastSalaryPaidDate: new Date() },
            { new: true }
        ).exec();

        if (!employee) {
            throw new NotFoundException(`Employee #${id} not found`);
        }
        return employee;
    }
}
