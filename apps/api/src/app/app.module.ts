import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { CategoriesModule } from '../categories/categories.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { Category } from '../categories/category.entity';
import { AuditLog } from '../audit-log/audit-log.entity';
import { CsrfMiddleware } from '../common/middleware/csrf.middleware';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_PATH || './data/stms.sqlite',
      entities: [Organization, User, Task, Category, AuditLog],
      synchronize: true,
    }),
    ConfigModule.forRoot(),
    AuthModule,
    TasksModule,
    CategoriesModule,
    AuditLogModule,
    OrganizationsModule,
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
