import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class TasksService {
    constructor(
        @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
        @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async create(createTaskDto: CreateTaskDto, userId: string, organizationId: string): Promise<Task> {
        const newTask = new this.taskModel({
            ...createTaskDto,
            createdBy: userId,
            organizationId,
        });
        return newTask.save();
    }

    async findAll(organizationId: string, projectId?: string, userId?: string, status?: string, role?: string): Promise<Task[]> {
        const filter: any = { organizationId };
        if (projectId) {
            filter.projectId = projectId;
        }
        if (role === 'EMPLOYEE') {
            const employee = await this.employeeModel.findOne({ userId: userId as any }).exec();
            const employeeIdStr = employee ? employee._id.toString() : null;

            if (employeeIdStr) {
                filter.$or = [
                    { assigneeId: employeeIdStr },
                    { createdBy: employeeIdStr }
                ];
            }
        } else if (userId) {
            // If they explicitly filter by a user
            filter.assigneeId = userId;
        }

        if (status) {
            if (status === 'NOT_CLOSED') {
                filter.status = { $ne: 'CLOSED' };
            } else if (status === 'ALL') {
                // Return all tasks, no status filter needed
            } else {
                filter.status = status;
            }
        }

        const tasks = await this.taskModel.find(filter)
            .populate('createdBy', 'firstName lastName email')
            .populate('projectId', 'name')
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return this.populateVirtualAssignees(tasks);
    }

    async findOne(id: string, organizationId: string): Promise<Task> {
        const filter: any = { _id: id, organizationId };
        const task = await this.taskModel.findOne(filter)
            .populate('createdBy', 'firstName lastName email')
            .lean()
            .exec();

        if (!task) throw new NotFoundException(`Task #${id} not found`);

        const [populatedTask] = await this.populateVirtualAssignees([task]);
        return populatedTask;
    }

    private async populateVirtualAssignees(tasks: any[]): Promise<any[]> {
        const assigneeIds = [...new Set(tasks
            .filter(t => t.assigneeId)
            .map(t => t.assigneeId.toString ? t.assigneeId.toString() : t.assigneeId))];

        if (assigneeIds.length === 0) return tasks;

        // 1. Try to find them in Employee collection
        const employees = await this.employeeModel.find({ _id: { $in: assigneeIds } }).select('name email department').lean().exec();
        const employeeMap = new Map(employees.map(e => [e._id.toString(), e]));

        // 2. Identify missing IDs (potential virtual employees/Users)
        const foundEmployeeIds = new Set(employees.map(e => e._id.toString()));
        const missingIds = assigneeIds.filter(id => !foundEmployeeIds.has(id));

        // 3. Try to find missing IDs in User collection
        let userMap = new Map();
        if (missingIds.length > 0) {
            const users = await this.userModel.find({ _id: { $in: missingIds } }).lean().exec();
            userMap = new Map(users.map(u => [
                u._id.toString(),
                {
                    _id: u._id,
                    name: `${u.firstName} ${u.lastName}`.trim(),
                    email: u.email,
                    department: 'Administration',
                    role: u.role
                }
            ]));
        }

        // 4. Combine and populate
        tasks.forEach(t => {
            if (t.assigneeId) {
                const idStr = t.assigneeId.toString ? t.assigneeId.toString() : t.assigneeId;
                t.assigneeId = employeeMap.get(idStr) || userMap.get(idStr) || null;
            }
        });

        return tasks;
    }

    async update(id: string, updateTaskDto: UpdateTaskDto, organizationId: string): Promise<Task> {
        const filter: any = { _id: id, organizationId };
        const task = await this.taskModel.findOneAndUpdate(filter, updateTaskDto, { new: true }).exec();
        if (!task) throw new NotFoundException(`Task #${id} not found`);
        return task;
    }

    async remove(id: string, organizationId: string): Promise<Task> {
        const filter: any = { _id: id, organizationId };
        const task = await this.taskModel.findOneAndDelete(filter).exec();
        if (!task) throw new NotFoundException(`Task #${id} not found`);
        return task;
    }
}
