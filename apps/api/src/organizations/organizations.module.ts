import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrgScopeService } from '../guards/org-scope.service';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Task } from '../entities/task.entity';
import { Category } from '../entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, User, Task, Category])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrgScopeService],
})
export class OrganizationsModule { }
