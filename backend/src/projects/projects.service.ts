import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { Employee, EmployeeDocument } from '../employees/schemas/employee.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
        @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    ) { }

    async create(createProjectDto: CreateProjectDto, userId: string, organizationId: string): Promise<Project> {
        const newProject = new this.projectModel({
            ...createProjectDto,
            createdBy: userId,
            organizationId,
        });
        return newProject.save();
    }

    async findAll(organizationId: string, userId: string, role: string): Promise<Project[]> {
        const filter: any = { organizationId };
        if (role === 'EMPLOYEE') {
            const employee = await this.employeeModel.findOne({ userId: userId as any }).exec();
            if (employee) filter.employees = employee._id;
        }
        return this.projectModel.find(filter).populate('employees', 'name email department').exec();
    }

    async findOne(id: string, organizationId: string): Promise<Project> {
        const filter: any = { _id: id, organizationId };
        const project = await this.projectModel.findOne(filter).populate('employees', 'name email department').exec();
        if (!project) throw new NotFoundException(`Project #${id} not found`);
        return project;
    }

    async update(id: string, updateProjectDto: UpdateProjectDto, organizationId: string): Promise<Project> {
        const filter: any = { _id: id, organizationId };
        const project = await this.projectModel.findOneAndUpdate(filter, updateProjectDto, { new: true }).exec();
        if (!project) throw new NotFoundException(`Project #${id} not found`);
        return project;
    }

    async remove(id: string, organizationId: string): Promise<Project> {
        const filter: any = { _id: id, organizationId };
        const project = await this.projectModel.findOneAndDelete(filter).exec();
        if (!project) throw new NotFoundException(`Project #${id} not found`);
        return project;
    }
}
