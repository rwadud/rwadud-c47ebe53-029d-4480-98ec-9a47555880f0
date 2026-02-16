import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrgScopeService } from '../common/services/org-scope.service';
import { Organization } from './organization.entity';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { Category } from '../categories/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, User, Task, Category])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrgScopeService],
})
export class OrganizationsModule { }
