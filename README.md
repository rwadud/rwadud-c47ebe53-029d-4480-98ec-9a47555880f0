# STMS - Secure Task Management System

A production-grade task management application with **role-based access control**, **organizational hierarchy**, and a **Kanban board** interface. Built as an NX monorepo with NestJS and Angular.

---

## Quick Start (3 Commands)

```bash
npm install
npx nx run api:seed         # Seeds demo data (5 users, 3 orgs, 8 tasks)
npx nx run-many -t serve     # Starts API (:3000) + Web (:4200)
```

Open **http://localhost:4200** and sign in with any demo account:

| Role   | Email              | Password      | Org          |
|--------|--------------------|---------------|--------------|
| Owner  | sarah@hq.com       | Password123!  | HQ (Parent)  |
| Admin  | marcus@east.com    | Password123!  | East Office  |
| Admin  | jordan@west.com    | Password123!  | West Office  |
| Viewer | alex@east.com      | Password123!  | East Office  |
| Viewer | priya@west.com     | Password123!  | West Office  |

---

## Architecture

```
stms/
├── apps/
│   ├── api/                           # NestJS backend
│   │   └── src/
│   │       ├── main.ts                # Bootstrap, global pipes/filters
│   │       ├── app.module.ts          # Root module, TypeORM + ConfigModule
│   │       ├── auth/                  # JWT + Passport authentication
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   └── jwt.strategy.ts
│   │       ├── tasks/                 # Task CRUD with ownership checks
│   │       │   ├── tasks.controller.ts
│   │       │   ├── tasks.service.ts
│   │       │   └── task.entity.ts
│   │       ├── categories/            # Category management
│   │       │   ├── categories.controller.ts
│   │       │   ├── categories.service.ts
│   │       │   └── category.entity.ts
│   │       ├── organizations/         # Org hierarchy CRUD
│   │       │   ├── organizations.controller.ts
│   │       │   ├── organizations.service.ts
│   │       │   └── organization.entity.ts
│   │       ├── users/                 # User management (Owner-only)
│   │       │   ├── users.controller.ts
│   │       │   ├── users.service.ts
│   │       │   └── user.entity.ts
│   │       ├── audit-log/             # Immutable audit trail
│   │       │   ├── audit-log.controller.ts
│   │       │   ├── audit-log.service.ts
│   │       │   └── audit-log.entity.ts
│   │       ├── common/                # Cross-cutting concerns
│   │       │   ├── filters/           # HttpExceptionFilter
│   │       │   ├── interceptors/      # AuditLogInterceptor
│   │       │   ├── middleware/        # CsrfMiddleware
│   │       │   └── services/          # OrgScopeService
│   │       └── seed/                  # Idempotent database seeder
│   │
│   └── web/                           # Angular frontend
│       └── src/app/
│           ├── pages/                 # Login, Dashboard, Categories,
│           │                          # Users, Organizations, AuditLog
│           ├── components/            # TaskCard, TaskModal, ConfirmDialog
│           ├── services/              # Auth, Task, Category, User,
│           │                          # Organization, AuditLog, Permission,
│           │                          # Toast, Theme
│           ├── guards/                # AuthGuard, PermissionGuard
│           └── interceptors/          # JWT auto-attach + 401 handling
│
└── libs/
    ├── data/                          # Shared types, DTOs, enums
    │   └── src/lib/
    │       ├── interfaces/            # Task, User, Organization, etc.
    │       ├── dto/                   # CreateTaskDto, UpdateUserDto, etc.
    │       ├── enums/                 # TaskStatus, TaskPriority, Role, etc.
    │       └── permissions/           # Role → Permission matrix
    │
    └── auth/                          # Shared auth utilities
        └── src/lib/
            ├── guards/                # JwtAuthGuard, RbacGuard
            ├── decorators/            # @Roles, @Public, @CurrentUser, @Auditable
            └── types/                 # PermissionSet
```

### Technology Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | Angular 20, Vanilla CSS, Angular CDK          |
| Backend    | NestJS 11, TypeORM 0.3, Passport JWT          |
| Database   | SQLite (via better-sqlite3) - zero config     |
| Monorepo   | NX with integrated workspace                  |
| Auth       | JWT tokens, bcrypt password hashing            |
| Testing    | Jest (backend + frontend)                      |

---

## RBAC & Security

### Permission Matrix

The RBAC system uses a **data-driven permission matrix** defined in `libs/data/src/lib/permissions/permission-matrix.ts`:

| Permission          | Owner | Admin | Viewer |
|---------------------|:-----:|:-----:|:------:|
| `task:create`       |  Yes  |  Yes  |  No    |
| `task:view`         |  Yes  |  Yes  |   Yes  |
| `task:edit_own`     |  Yes  |  Yes  |  No    |
| `task:edit_any`     |  Yes  |  No   |  No    |
| `task:delete_own`   |  Yes  |  Yes  |  No    |
| `task:delete_any`   |  Yes  |  No   |  No    |
| `category:create`   |  Yes  |  No   |  No    |
| `category:edit`     |  Yes  |  No   |  No    |
| `category:delete`   |  Yes  |  No   |  No    |
| `category:view`     |  Yes  |  Yes  |   Yes  |
| `user:manage`       |  Yes  |  No   |  No    |
| `org:manage`        |  Yes  |  No   |  No    |
| `audit:view`        |  Yes  |  Yes  |  No    |

### Organization Hierarchy

Two-level structure with automatic data scoping:

```
HQ (Parent Org)
├── East Office (Child)
└── West Office (Child)
```

- **Parent org users** see data across all organizations
- **Child org users** see only their own organization's data
- Enforced at the query level via `OrgScopeService`

### Security Features

- **JWT Authentication** with configurable expiration
- **bcrypt** password hashing (10 rounds)
- **RBAC Guard** on every protected endpoint
- **Organization-level data isolation**
- **Audit trail** for all create/update/delete operations (diff-tracked)
- **CORS** configured for dev frontend origin
- **Input validation** via class-validator pipes
- **Route-level permission guards** on frontend

---

## Entity Relationship Diagram

```
┌────────────────┐       ┌──────────────────┐
│  Organization  │       │      User        │
├────────────────┤       ├──────────────────┤
│ id (PK)        │◄──┐   │ id (PK)          │
│ name           │   │   │ email (unique)   │
│ parentId (FK)  │───┘   │ password (hash)  │
│                │◄──────│ organizationId   │
│                │       │ role (enum)      │
└────────────────┘       └──────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌────────────────┐       ┌──────────────────┐
│    Category    │       │      Task        │
├────────────────┤       ├──────────────────┤
│ id (PK)        │       │ id (PK)          │
│ name           │◄──────│ categoryId (FK)  │
│ organizationId │       │ title            │
│ createdById    │       │ description      │
└────────────────┘       │ status (enum)    │
                         │ priority (enum)  │
                         │ position (int)   │
                         │ createdById (FK) │
                         │ organizationId   │
                         └──────────────────┘

┌──────────────────┐
│    AuditLog      │
├──────────────────┤
│ id (PK)          │
│ action (enum)    │
│ resource (enum)  │
│ resourceId       │
│ userId (FK)      │
│ organizationId   │
│ details (JSON)   │
│ timestamp        │
└──────────────────┘
```

---

## API Reference

All endpoints prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Authentication

```
POST /api/auth/login
Body: { "email": "sarah@hq.com", "password": "Password123!" }
Response: { "accessToken": "jwt...", "user": { id, email, name, role, organizationId, organization } }
```

### Tasks

| Method | Endpoint              | Permission           | Description             |
|--------|----------------------|----------------------|-------------------------|
| GET    | `/api/tasks`         | `task:view`          | List tasks (org-scoped) |
| POST   | `/api/tasks`         | `task:create`        | Create task             |
| PUT    | `/api/tasks/:id`     | `task:edit_own/any`  | Update task             |
| DELETE | `/api/tasks/:id`     | `task:delete_own/any`| Delete task             |
| PATCH  | `/api/tasks/reorder` | `task:create`        | Reorder tasks           |

**Query params:** `?status=todo&priority=high&categoryId=1&sortBy=createdAt&sortOrder=DESC`

### Categories

| Method | Endpoint                  | Permission          | Description    |
|--------|--------------------------|---------------------| --------------|
| GET    | `/api/categories`        | `category:view`     | List all       |
| POST   | `/api/categories`        | `category:create`   | Create (Owner) |
| PUT    | `/api/categories/:id`    | `category:edit`     | Update (Owner) |
| DELETE | `/api/categories/:id`    | `category:delete`   | Delete (Owner) |

### Users

| Method | Endpoint             | Permission      | Description              |
|--------|---------------------|-----------------|--------------------------|
| GET    | `/api/users`        | `user:manage`   | List users (org-scoped)  |
| POST   | `/api/users`        | `user:manage`   | Create user (Owner)      |
| PUT    | `/api/users/:id`    | `user:manage`   | Update user (Owner)      |
| DELETE | `/api/users/:id`    | `user:manage`   | Delete user (Owner)      |

### Organizations

| Method | Endpoint                  | Permission     | Description             |
|--------|--------------------------|----------------|-------------------------|
| GET    | `/api/organizations`     | `org:manage`   | List all organizations  |
| POST   | `/api/organizations`     | `org:manage`   | Create organization     |
| PUT    | `/api/organizations/:id` | `org:manage`   | Update organization     |
| DELETE | `/api/organizations/:id` | `org:manage`   | Delete organization     |

### Audit Log

| Method | Endpoint           | Permission    | Description         |
|--------|--------------------|---------------|---------------------|
| GET    | `/api/audit-log`   | `audit:view`  | List all (org-scoped)|

---

## Sample Requests

```bash
# Login
TOKEN=$(curl -s http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah@hq.com","password":"Password123!"}' \
  | jq -r '.accessToken')

# List tasks
curl -s http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN" | jq .

# Create task
curl -s -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Deploy v2","description":"Ship to production","priority":"urgent","status":"todo"}' | jq .

# Update task
curl -s -X PUT http://localhost:3000/api/tasks/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}' | jq .

# Delete task
curl -s -X DELETE http://localhost:3000/api/tasks/1 \
  -H "Authorization: Bearer $TOKEN" | jq .

# List audit log
curl -s http://localhost:3000/api/audit-log \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test RBAC: Viewer cannot create tasks
VIEWER_TOKEN=$(curl -s http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"priya@west.com","password":"Password123!"}' \
  | jq -r '.accessToken')

curl -s -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Should fail"}' | jq .
# → 403 Forbidden: Insufficient permissions
```

---

## Frontend Features

- **Kanban Board** with drag-and-drop (To Do → In Progress → Done)
- **Role-aware UI** - buttons/actions hidden based on permissions
- **Dark/Light mode** with system preference detection
- **Responsive design** - sidebar collapses to bottom nav on mobile
- **Toast notifications** for all CRUD feedback
- **Inline filters** for category and priority
- **User Management** page (Owner-only) with role assignment
- **Organization Management** page (Owner-only) with hierarchy
- **Task completion visualization** — progress bar showing done vs remaining tasks
- **Keyboard shortcuts** — `N` to create new task, `Escape` to close modals
- **Demo credential buttons** on login page for quick evaluation

---

## Environment Variables

| Variable         | Default                    | Description                    |
|------------------|----------------------------|--------------------------------|
| `JWT_SECRET`     | `stms-dev-secret-key-2024` | JWT signing secret             |
| `JWT_EXPIRES_IN` | `1h`                       | Token expiration               |
| `DATABASE_PATH`  | `./data/stms.sqlite`       | SQLite database file path      |
| `PORT`           | `3000`                     | API server port                |

---

## Running Tests

```bash
npx nx test api      # Backend unit tests  (AuthService, RBAC, all services)
npx nx test web      # Frontend unit tests (services, components)
npx nx test auth     # Auth library tests  (permission matrix, RbacGuard)
npx nx test data     # Data library tests  (permission matrix)
```

---

## Design Decisions

1. **SQLite** - Zero-config database for instant evaluation. No Docker, no PostgreSQL setup.
2. **Data-driven RBAC** - Permission matrix in `libs/data` is a lookup table, making it trivial to add roles/permissions.
3. **Org-scoping at query level** - `OrgScopeService` ensures data isolation without middleware magic.
4. **Shared libs** - `@stms/data` and `@stms/auth` are used by both frontend and backend, ensuring type safety across the stack.
5. **Co-located entities** - Each backend module contains its own TypeORM entity alongside its service and controller.
6. **Idempotent seed** - Run `npx nx run api:seed` repeatedly without duplicating data.
7. **Standalone Angular components** - Modern Angular patterns with signals, lazy loading, and functional guards.
8. **Diff-tracked audit logging** - Only actual changes are logged, not entire DTOs.

---

## Future Considerations

### Advanced Role Delegation

- **Custom roles** — Allow organizations to define their own roles beyond Owner/Admin/Viewer, with fine-grained permission sets.
- **Role delegation chains** — Let Owners delegate specific permissions to Admins without promoting them to full Owner status.
- **Per-resource permissions** — Assign permissions scoped to individual tasks or categories rather than entire organizations.

### Production-Ready Security

- **JWT refresh tokens** — Implement a refresh token rotation flow with short-lived access tokens (5 min) and long-lived refresh tokens (7 days) stored in HTTP-only cookies. Detect token reuse to identify stolen refresh tokens.
- **Content Security Policy** — Add CSP headers to mitigate XSS and injection attacks in production deployments.
- **Rate limiting** — Add per-IP and per-user rate limiting on auth endpoints to prevent brute-force attacks.
- **Password policies** — Enforce minimum complexity, track password history, and support account lockout after failed attempts.

### RBAC Caching

- **In-memory permission cache** — Cache the permission matrix lookups per user session to avoid repeated computation on every request. Invalidate on role or organization changes.
- **Redis-backed cache** — For multi-instance deployments, use Redis to share permission cache across API servers with TTL-based expiration.

### Scaling Permission Checks

- **Bitwise permissions** — Replace the array-based permission matrix with a bitfield representation for O(1) permission checks instead of O(n) `includes()` lookups.
- **Database-backed permissions** — Move the permission matrix to a `permissions` table for runtime configurability without code deployments.
- **Organization tree caching** — Pre-compute and cache the organization hierarchy to avoid recursive queries when resolving parent/child visibility scopes.
- **Pagination for scoped queries** — Add cursor-based pagination to all list endpoints to handle organizations with thousands of tasks efficiently.
