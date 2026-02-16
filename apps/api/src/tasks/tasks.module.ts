import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/task.entity';
import { Organization } from '../organizations/organization.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { OrgScopeService } from '../common/services/org-scope.service';
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
