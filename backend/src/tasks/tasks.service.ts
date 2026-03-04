import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
    constructor(
        @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
        @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    ) { }

    async create(createTaskDto: CreateTaskDto, userId: string, organizationId: string): Promise<Task> {
        const newTask = new this.taskModel({
            ...createTaskDto,
            createdBy: userId,
            organizationId,
        });
        return newTask.save();
    }

    async findAll(organizationId: string, projectId?: string, userId?: string, role?: string): Promise<Task[]> {
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

        return this.taskModel.find(filter)
            .populate('assigneeId', 'name email department')
            .populate('createdBy', 'firstName lastName email')
            .populate('projectId', 'name')
            .sort({ createdAt: -1 })
            .exec();
    }

    async findOne(id: string, organizationId: string): Promise<Task> {
        const filter: any = { _id: id, organizationId };
        const task = await this.taskModel.findOne(filter)
            .populate('assigneeId', 'name email department')
            .populate('createdBy', 'firstName lastName email')
            .exec();
        if (!task) throw new NotFoundException(`Task #${id} not found`);
        return task;
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
