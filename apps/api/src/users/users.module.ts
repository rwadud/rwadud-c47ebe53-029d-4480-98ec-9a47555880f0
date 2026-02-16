import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Organization } from '../organizations/organization.entity';
import { OrgScopeService } from '../common/services/org-scope.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization]),
    AuditLogModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, OrgScopeService],
})
export class UsersModule { }
