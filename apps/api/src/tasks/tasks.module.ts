import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { OrgScopeService } from '../guards/org-scope.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Organization]),
    AuditLogModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, OrgScopeService],
})
export class TasksModule { }
