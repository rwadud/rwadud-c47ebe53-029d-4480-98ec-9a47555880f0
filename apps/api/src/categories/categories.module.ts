import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { Organization } from '../entities/organization.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { OrgScopeService } from '../guards/org-scope.service';
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
