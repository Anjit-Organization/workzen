import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { EmployeesModule } from '../employees/employees.module';
import { LeavesModule } from '../leaves/leaves.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { Leave, LeaveSchema } from '../leaves/schemas/leave.schema';
import { Attendance, AttendanceSchema } from '../attendance/schemas/attendance.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';

import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: User.name, schema: UserSchema },
      { name: Leave.name, schema: LeaveSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Task.name, schema: TaskSchema },
    ])
  ],

  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule { }
