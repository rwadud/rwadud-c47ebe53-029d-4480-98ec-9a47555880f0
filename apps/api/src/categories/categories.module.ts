import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Organization } from '../organizations/organization.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { OrgScopeService } from '../common/services/org-scope.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Organization]),
    AuditLogModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, OrgScopeService],
})
export class CategoriesModule { }
