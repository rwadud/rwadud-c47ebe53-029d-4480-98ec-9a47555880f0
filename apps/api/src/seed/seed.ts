import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { Category } from '../categories/category.entity';
import { AuditLog } from '../audit-log/audit-log.entity';
import { Role, TaskStatus, TaskPriority, AuditAction, AuditResource } from '@stms/data';
import * as fs from 'fs';
import * as path from 'path';

async function seed(force = false) {
  const dbPath = process.env.DATABASE_PATH || './data/stms.sqlite';
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Skip seeding if database already exists (unless --force is passed)
  if (!force && fs.existsSync(dbPath)) {
    console.log('✅ Database already exists. Skipping seed. Use "npm run seed:fresh" to re-seed.');
    return;
  }

  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: dbPath,
    entities: [Organization, User, Task, Category, AuditLog],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('🌱 Database connected. Seeding...');

  // Clear existing data
  await dataSource.getRepository(AuditLog).clear();
  await dataSource.getRepository(Task).clear();
  await dataSource.getRepository(Category).clear();
  await dataSource.getRepository(User).clear();
  await dataSource.getRepository(Organization).createQueryBuilder().delete().from(Organization).execute();

  // --- Organizations ---
  const orgRepo = dataSource.getRepository(Organization);
  const hq = await orgRepo.save({ name: 'HQ', parentId: null });
  const east = await orgRepo.save({ name: 'East Office', parentId: hq.id });
  const west = await orgRepo.save({ name: 'West Office', parentId: hq.id });
  console.log('  ✅ Organizations created: HQ, East Office, West Office');

  // --- Users ---
  const userRepo = dataSource.getRepository(User);
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const sarah = await userRepo.save({
    email: 'sarah@hq.com',
    password: hashedPassword,
    name: 'Sarah Chen',
    role: Role.OWNER,
    organizationId: hq.id,
  });

  const marcus = await userRepo.save({
    email: 'marcus@east.com',
    password: hashedPassword,
    name: 'Marcus Rivera',
    role: Role.ADMIN,
    organizationId: east.id,
  });

  const priya = await userRepo.save({
    email: 'priya@west.com',
    password: hashedPassword,
    name: 'Priya Patel',
    role: Role.VIEWER,
    organizationId: west.id,
  });

  const alex = await userRepo.save({
    email: 'alex@east.com',
    password: hashedPassword,
    name: 'Alex Kim',
    role: Role.VIEWER,
    organizationId: east.id,
  });

  const jordan = await userRepo.save({
    email: 'jordan@west.com',
    password: hashedPassword,
    name: 'Jordan Lee',
    role: Role.ADMIN,
    organizationId: west.id,
  });

  console.log('  ✅ Users created: Sarah (Owner/HQ), Marcus (Admin/East), Priya (Viewer/West), Alex (Viewer/East), Jordan (Admin/West)');

  // --- Categories ---
  const catRepo = dataSource.getRepository(Category);
  const compliance = await catRepo.save({ name: 'Compliance', organizationId: hq.id, createdById: sarah.id });
  const operations = await catRepo.save({ name: 'Operations', organizationId: hq.id, createdById: sarah.id });
  const hr = await catRepo.save({ name: 'Human Resources', organizationId: hq.id, createdById: sarah.id });
  const maintenance = await catRepo.save({ name: 'Maintenance', organizationId: hq.id, createdById: sarah.id });
  console.log('  ✅ Categories created: Compliance, Operations, Human Resources, Maintenance');

  const taskRepo = dataSource.getRepository(Task);
  const today = new Date();
  const futureDate = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };
  const pastDate = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };
  const pastTimestamp = (days: number, hours = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    d.setHours(d.getHours() - hours);
    return d;
  };

  const tasks = [
    {
      title: 'Q1 Compliance Review',
      description: 'Complete quarterly compliance audit for East Office operations',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      categoryId: compliance.id,
      createdById: sarah.id,
      organizationId: east.id,
      position: 0,
      dueDate: futureDate(7),
    },
    {
      title: 'Update Security Protocols',
      description: 'Review and update security protocols for all offices',
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
      categoryId: compliance.id,
      createdById: sarah.id,
      organizationId: hq.id,
      position: 1,
      dueDate: pastDate(2),
    },
    {
      title: 'Office Supply Inventory',
      description: 'Conduct monthly inventory check for East Office supplies',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      categoryId: operations.id,
      createdById: marcus.id,
      organizationId: east.id,
      position: 2,
      dueDate: futureDate(14),
    },
    {
      title: 'Team Standup Schedule',
      description: 'Reorganize daily standup times for the East Office team',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      categoryId: operations.id,
      createdById: marcus.id,
      organizationId: east.id,
      position: 3,
      dueDate: null,
    },
    {
      title: 'New Hire Onboarding - West',
      description: 'Prepare onboarding materials for new West Office hires',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      categoryId: hr.id,
      createdById: jordan.id,
      organizationId: west.id,
      position: 4,
      dueDate: futureDate(3),
    },
    {
      title: 'HVAC Maintenance Request',
      description: 'Schedule HVAC system maintenance for West Office building',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      categoryId: maintenance.id,
      createdById: jordan.id,
      organizationId: west.id,
      position: 5,
      dueDate: futureDate(21),
    },
    {
      title: 'Annual Performance Reviews',
      description: 'Coordinate annual performance reviews across all offices',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      categoryId: hr.id,
      createdById: sarah.id,
      organizationId: hq.id,
      position: 6,
      dueDate: futureDate(30),
    },
    {
      title: 'Vendor Contract Renewal',
      description: 'Review and renew contracts with key vendors before Q2',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      categoryId: operations.id,
      createdById: sarah.id,
      organizationId: hq.id,
      position: 7,
      dueDate: pastDate(1),
    },
  ];

  const savedTasks = [];
  for (const taskData of tasks) {
    savedTasks.push(await taskRepo.save(taskData));
  }
  console.log(`  ✅ Tasks created: ${tasks.length} sample tasks across all orgs`);

  // --- Audit Logs ---
  const auditRepo = dataSource.getRepository(AuditLog);
  const auditLogs = [
    // Sarah created categories (5 days ago)
    {
      action: AuditAction.CREATE,
      resource: AuditResource.CATEGORY,
      resourceId: compliance.id,
      userId: sarah.id,
      organizationId: hq.id,
      details: JSON.stringify({ name: 'Compliance' }),
      timestamp: pastTimestamp(5, 8),
    },
    {
      action: AuditAction.CREATE,
      resource: AuditResource.CATEGORY,
      resourceId: operations.id,
      userId: sarah.id,
      organizationId: hq.id,
      details: JSON.stringify({ name: 'Operations' }),
      timestamp: pastTimestamp(5, 7),
    },
    {
      action: AuditAction.CREATE,
      resource: AuditResource.CATEGORY,
      resourceId: hr.id,
      userId: sarah.id,
      organizationId: hq.id,
      details: JSON.stringify({ name: 'Human Resources' }),
      timestamp: pastTimestamp(5, 6),
    },
    {
      action: AuditAction.CREATE,
      resource: AuditResource.CATEGORY,
      resourceId: maintenance.id,
      userId: sarah.id,
      organizationId: hq.id,
      details: JSON.stringify({ name: 'Maintenance' }),
      timestamp: pastTimestamp(5, 5),
    },
    // Sarah created users (4 days ago)
    {
      action: AuditAction.CREATE,
      resource: AuditResource.USER,
      resourceId: marcus.id,
      userId: sarah.id,
      organizationId: hq.id,
      details: JSON.stringify({ email: 'marcus@east.com', role: 'admin', organization: 'East Office' }),
      timestamp: pastTimestamp(4, 6),
    },
    {
      action: AuditAction.CREATE,
      resource: AuditResource.USER,
      resourceId: jordan.id,
      userId: sarah.id,
      organizationId: hq.id,
      details: JSON.stringify({ email: 'jordan@west.com', role: 'admin', organization: 'West Office' }),
      timestamp: pastTimestamp(4, 5),
    },
    {
      action: AuditAction.CREATE,
      resource: AuditResource.USER,
      resourceId: alex.id,
      userId: sarah.id,
      organizationId: hq.id,
      details: JSON.stringify({ email: 'alex@east.com', role: 'viewer', organization: 'East Office' }),
      timestamp: pastTimestamp(4, 4),
    },
    {
      action: AuditAction.CREATE,
      resource: AuditResource.USER,
      resourceId: priya.id,
      userId: sarah.id,
      organizationId: hq.id,
      details: JSON.stringify({ email: 'priya@west.com', role: 'viewer', organization: 'West Office' }),
      timestamp: pastTimestamp(4, 3),
    },
    // Sarah created tasks (3 days ago)
    {
      action: AuditAction.CREATE,
      resource: AuditResource.TASK,
      resourceId: savedTasks[0].id,
      userId: sarah.id,
      organizationId: east.id,
      details: JSON.stringify({ title: 'Q1 Compliance Review', priority: 'high', status: 'todo' }),
      timestamp: pastTimestamp(3, 8),
    },
    {
      action: AuditAction.CREATE,
      resource: AuditResource.TASK,
      resourceId: savedTasks[1].id,
      userId: sarah.id,
      organizationId: hq.id,
      details: JSON.stringify({ title: 'Update Security Protocols', priority: 'urgent', status: 'todo' }),
      timestamp: pastTimestamp(3, 7),
    },
    // Marcus created tasks (3 days ago)
    {
      action: AuditAction.CREATE,
      resource: AuditResource.TASK,
      resourceId: savedTasks[2].id,
      userId: marcus.id,
      organizationId: east.id,
      details: JSON.stringify({ title: 'Office Supply Inventory', priority: 'low', status: 'todo' }),
      timestamp: pastTimestamp(3, 5),
    },
    {
      action: AuditAction.CREATE,
      resource: AuditResource.TASK,
      resourceId: savedTasks[3].id,
      userId: marcus.id,
      organizationId: east.id,
      details: JSON.stringify({ title: 'Team Standup Schedule', priority: 'medium', status: 'todo' }),
      timestamp: pastTimestamp(3, 4),
    },
    // Jordan created tasks (2 days ago)
    {
      action: AuditAction.CREATE,
      resource: AuditResource.TASK,
      resourceId: savedTasks[4].id,
      userId: jordan.id,
      organizationId: west.id,
      details: JSON.stringify({ title: 'New Hire Onboarding - West', priority: 'high', status: 'todo' }),
      timestamp: pastTimestamp(2, 6),
    },
    {
      action: AuditAction.CREATE,
      resource: AuditResource.TASK,
      resourceId: savedTasks[5].id,
      userId: jordan.id,
      organizationId: west.id,
      details: JSON.stringify({ title: 'HVAC Maintenance Request', priority: 'medium', status: 'todo' }),
      timestamp: pastTimestamp(2, 5),
    },
    // Sarah updated Q1 Compliance Review: todo → in_progress (2 days ago)
    {
      action: AuditAction.UPDATE,
      resource: AuditResource.TASK,
      resourceId: savedTasks[0].id,
      userId: sarah.id,
      organizationId: east.id,
      details: JSON.stringify({ changes: { status: { from: 'todo', to: 'in_progress' } } }),
      timestamp: pastTimestamp(2, 3),
    },
    // Marcus updated Team Standup Schedule: todo → done (1 day ago)
    {
      action: AuditAction.UPDATE,
      resource: AuditResource.TASK,
      resourceId: savedTasks[3].id,
      userId: marcus.id,
      organizationId: east.id,
      details: JSON.stringify({ changes: { status: { from: 'todo', to: 'done' } } }),
      timestamp: pastTimestamp(1, 8),
    },
    // Jordan updated New Hire Onboarding: todo → in_progress (1 day ago)
    {
      action: AuditAction.UPDATE,
      resource: AuditResource.TASK,
      resourceId: savedTasks[4].id,
      userId: jordan.id,
      organizationId: west.id,
      details: JSON.stringify({ changes: { status: { from: 'todo', to: 'in_progress' } } }),
      timestamp: pastTimestamp(1, 5),
    },
    // Sarah updated Vendor Contract Renewal priority: high → urgent (1 day ago)
    {
      action: AuditAction.UPDATE,
      resource: AuditResource.TASK,
      resourceId: savedTasks[7].id,
      userId: sarah.id,
      organizationId: hq.id,
      details: JSON.stringify({ changes: { priority: { from: 'high', to: 'urgent' }, status: { from: 'todo', to: 'in_progress' } } }),
      timestamp: pastTimestamp(1, 2),
    },
    // Sarah updated Alex's role: viewer (no change, but updated name) (today)
    {
      action: AuditAction.UPDATE,
      resource: AuditResource.USER,
      resourceId: alex.id,
      userId: sarah.id,
      organizationId: hq.id,
      details: JSON.stringify({ changes: { name: { from: 'Alex K.', to: 'Alex Kim' } } }),
      timestamp: pastTimestamp(0, 4),
    },
  ];

  for (const log of auditLogs) {
    await auditRepo.save(log);
  }
  console.log(`  ✅ Audit logs created: ${auditLogs.length} entries`);

  await dataSource.destroy();
  console.log('\n🎉 Seeding complete! Demo credentials:');
  console.log('  Owner:  sarah@hq.com / Password123!');
  console.log('  Admin:  marcus@east.com / Password123!');
  console.log('  Admin:  jordan@west.com / Password123!');
  console.log('  Viewer: priya@west.com / Password123!');
  console.log('  Viewer: alex@east.com / Password123!');
}

const force = process.argv.includes('--force');
seed(force).catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
