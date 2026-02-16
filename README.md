# 🔐 STMS — Secure Task Management System

A production-grade task management application with **role-based access control**, **organizational hierarchy**, and a **Kanban board** interface. Built as an NX monorepo with NestJS and Angular.

---

## ⚡ Quick Start (3 Commands)

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

## 🏗 Architecture

```
stms/
├── apps/
│   ├── api/              # NestJS backend
│   │   └── src/
│   │       ├── auth/     # JWT + Passport authentication
│   │       ├── guards/   # RBAC guard + org-scope service
│   │       ├── tasks/    # Task CRUD with ownership checks
│   │       ├── categories/ # Category management (Owner-only)
│   │       ├── audit-log/  # Immutable audit trail
│   │       ├── entities/ # TypeORM entities (SQLite)
│   │       └── seed.ts   # Idempotent database seeder
│   └── web/              # Angular frontend
│       └── src/app/
│           ├── pages/    # Login, Dashboard, AuditLog, Categories
│           ├── services/ # Auth, Task, Category, AuditLog, Toast, Theme
│           └── interceptors/ # JWT auto-attach + 401 handling
├── libs/
│   ├── data/             # Shared enums, interfaces, DTOs
│   └── auth/             # RBAC permission matrix (shared)
└── .env                  # Environment variables
```

### Technology Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | Angular 20, TailwindCSS v4, Angular CDK       |
| Backend    | NestJS 11, TypeORM 0.3, Passport JWT          |
| Database   | SQLite (via better-sqlite3) — zero config     |
| Monorepo   | NX with integrated workspace                  |
| Auth       | JWT tokens, bcrypt password hashing            |

---

## 🛡 RBAC & Security

### Permission Matrix

The RBAC system uses a **data-driven permission matrix** (not if/else chains), defined in `libs/auth/src/lib/permissions.ts`:

| Permission          | Owner | Admin | Viewer |
|---------------------|:-----:|:-----:|:------:|
| `task:create`       |  ✅   |  ✅   |   ❌   |
| `task:read`         |  ✅   |  ✅   |   ✅   |
| `task:edit_own`     |  ✅   |  ✅   |   ❌   |
| `task:edit_any`     |  ✅   |   ❌  |   ❌   |
| `task:delete_own`   |  ✅   |  ✅   |   ❌   |
| `task:delete_any`   |  ✅   |   ❌  |   ❌   |
| `category:manage`   |  ✅   |   ❌  |   ❌   |
| `audit:view`        |  ✅   |  ✅   |   ❌   |

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
- **Audit trail** for all create/update/delete operations
- **CORS** configured for dev frontend origin
- **Input validation** via class-validator pipes

---

## 📊 Entity Relationship Diagram

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

## 🔌 API Reference

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
| GET    | `/api/tasks`         | `task:read`          | List tasks (org-scoped) |
| POST   | `/api/tasks`         | `task:create`        | Create task             |
| PUT    | `/api/tasks/:id`     | `task:edit_own/any`  | Update task             |
| DELETE | `/api/tasks/:id`     | `task:delete_own/any`| Delete task             |
| PATCH  | `/api/tasks/reorder` | `task:create`        | Reorder tasks           |

**Query params:** `?status=todo&priority=high&categoryId=1&sortBy=createdAt&sortOrder=DESC`

### Categories

| Method | Endpoint                  | Permission         | Description    |
|--------|--------------------------|--------------------| --------------|
| GET    | `/api/categories`        | `task:read`        | List all       |
| POST   | `/api/categories`        | `category:manage`  | Create (Owner) |
| PUT    | `/api/categories/:id`    | `category:manage`  | Update (Owner) |
| DELETE | `/api/categories/:id`    | `category:manage`  | Delete (Owner) |

### Audit Log

| Method | Endpoint           | Permission    | Description         |
|--------|--------------------|---------------|---------------------|
| GET    | `/api/audit-log`   | `audit:view`  | List all (org-scoped)|

---

## 🧪 Sample Requests

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

## 🎨 Frontend Features

- **Kanban Board** with drag-and-drop (To Do → In Progress → Done)
- **Role-aware UI** — buttons/actions hidden based on permissions
- **Dark/Light mode** with system preference detection
- **Responsive design** — sidebar collapses to bottom nav on mobile
- **Toast notifications** for all CRUD feedback
- **Inline filters** for category and priority
- **Demo credential buttons** on login page for quick evaluation

---

## 📋 Environment Variables

| Variable         | Default                    | Description                    |
|------------------|----------------------------|--------------------------------|
| `JWT_SECRET`     | `stms-dev-secret-key-2024` | JWT signing secret             |
| `JWT_EXPIRES_IN` | `1h`                       | Token expiration               |
| `DATABASE_PATH`  | `./data/stms.sqlite`       | SQLite database file path      |
| `PORT`           | `3000`                     | API server port                |

---

## 🧪 Running Tests

```bash
npx nx test api      # Backend unit tests
npx nx test web      # Frontend unit tests
```

---

## 📝 Design Decisions

1. **SQLite** — Zero-config database for instant evaluation. No Docker, no PostgreSQL setup.
2. **Data-driven RBAC** — Permission matrix in `libs/auth` is a lookup table, making it trivial to add roles/permissions.
3. **Org-scoping at query level** — `OrgScopeService` ensures data isolation without middleware magic.
4. **Shared libs** — `@stms/data` and `@stms/auth` are used by both frontend and backend, ensuring type safety.
5. **Idempotent seed** — Run `npx nx run api:seed` repeatedly without duplicating data.
6. **Standalone Angular components** — Modern Angular patterns with signals, lazy loading, and functional guards.
