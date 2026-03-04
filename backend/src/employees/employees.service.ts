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

@Injectable()
export class EmployeesService {
    constructor(
        @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
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
            role: Role.EMPLOYEE,
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

        return { data, total };
    }

    async findOne(id: string, organizationId: string): Promise<Employee> {
        const filter: any = { _id: id };
        if (organizationId) filter.organizationId = organizationId;

        const employee = await this.employeeModel.findOne(filter).populate('userId', 'firstName lastName email').exec();
        if (!employee || employee.status === 'TERMINATED') {
            throw new NotFoundException(`Employee #${id} not found`);
        }
        return employee;
    }

    async getInsights(id: string, organizationId: string) {
        const employee = await this.findOne(id, organizationId);

        // Fetch Leave History
        const leaves = await this.leaveModel.find({ employeeId: id, organizationId }).sort({ createdAt: -1 }).exec();

        // Fetch Attendance History (Limit to last 30 for visualization purposes)
        const attendance = await this.attendanceModel.find({ employeeId: id, organizationId })
            .sort({ date: -1 })
            .limit(30)
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
