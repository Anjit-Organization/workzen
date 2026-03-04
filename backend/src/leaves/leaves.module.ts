import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';
import { Leave, LeaveSchema } from './schemas/leave.schema';
import { LeaveBalance, LeaveBalanceSchema } from './schemas/leave-balance.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { UsersModule } from '../users/users.module'; // To verify if HR/Admin
import { EmployeesModule } from '../employees/employees.module'; // To verify if employee exists

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Leave.name, schema: LeaveSchema },
      { name: LeaveBalance.name, schema: LeaveBalanceSchema },
      { name: Employee.name, schema: EmployeeSchema }
    ]),
    UsersModule,
    EmployeesModule,
  ],
  providers: [LeavesService],
  controllers: [LeavesController],
  exports: [LeavesService],
})
export class LeavesModule { }
