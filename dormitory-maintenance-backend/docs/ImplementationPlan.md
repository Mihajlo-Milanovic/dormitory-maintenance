# Student Dormitory Maintenance System — Backend Implementation Plan

## 1. Executive Summary

This document outlines the implementation plan for the backend application of the **Student Dormitory Maintenance System**. Built as a robust REST and Real-Time WebSocket API using **NestJS**, **Prisma ORM**, **PostgreSQL**, and **Passport.js (JWT)**, the backend supports role-based access control (RBAC) and data consistency for three actor types:
1. **Students:** Create, view, edit, and track damage/defect reports with real-time updates and timeline history (`ReportEvent`).
2. **Janitors:** Browse unassigned reports (filtered by specializations), manage active jobs (one active job limit), record time estimates, request supplies, and resume paused jobs.
3. **Administrators:** Monitor global workloads, manage user accounts and janitor specializations (single or CSV bulk import), procure and track supply requests, handle emergency reassignments, and adjust report severity with audit logging.

---

## 2. Technical Stack & Architecture

- **Framework:** NestJS (Modular architecture with feature modules, dependency injection, and exception filters).
- **ORM & Database:** Prisma ORM connected to PostgreSQL, using transactions and optimistic locking for concurrency control (race-safe job acceptance and reassignment).
- **Authentication & Security:** 
  - Passport.js with Local Strategy (login) and JWT Strategy (API bearer tokens).
  - Refresh token rotation with family reuse detection and `httpOnly`, `Secure`, `SameSite` cookies.
  - Password hashing with Argon2id (or bcrypt fallback) and password policy enforcement.
  - Role-based guards (`RolesGuard`, `JwtAuthGuard`) enforcing the least privilege on every endpoint.
- **Real-Time Communication:** NestJS WebSocket Gateway (Socket.io or WebSockets) with JWT authentication and room-based event broadcasting (role-scoped rooms and specialization-specific subscription rooms).
- **Validation & DTOs:** `class-validator` and `class-transformer` for strict payload validation.

---

## 3. Project & Module Structure (`src/`)

```text
src/
├── prisma/
│   ├── prisma.module.ts       # Global Prisma service provider
│   └── prisma.service.ts      # PrismaClient wrapper with lifecycle hooks
├── auth/                      # Authentication & token rotation
│   ├── decorators/            # @Roles, @CurrentUser
│   ├── guards/                # JwtAuthGuard, RolesGuard, LocalAuthGuard
│   ├── strategies/            # JwtStrategy, LocalStrategy
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── users/                     # User management & CSV bulk import
│   ├── dto/
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── reports/                   # Damage/defect reports & timeline events
│   ├── dto/
│   ├── reports.controller.ts
│   ├── reports.module.ts
│   └── reports.service.ts
├── jobs/                      # Janitor job execution & reassignments
│   ├── dto/
│   ├── jobs.controller.ts
│   ├── jobs.module.ts
│   └── jobs.service.ts
├── supplies/                  # Supply requests & administrator queue
│   ├── dto/
│   ├── supplies.controller.ts
│   ├── supplies.module.ts
│   └── supplies.service.ts
├── notifications/             # Real-time WebSocket gateway & notification storage
│   ├── notifications.gateway.ts
│   ├── notifications.module.ts
│   └── notifications.service.ts
├── app.module.ts              # Root module importing feature modules
└── main.ts                    # Application bootstrap, validation pipes, CORS
```

---

## 4. Feature Modules & Detailed Requirements

### 4.1 Prisma Schema & Database Models
- **User:** id, name, email, passwordHash, role (`student`, `janitor`, `administrator`), active (`boolean`), roomNumber (student only, nullable), activatedAt, timestamps.
- **JanitorSpecialization:** id, janitorId (FK), category (`plumbing`, `electrical`, `furniture`, `heating`, `other`).
- **AuditLog:** id, actorId (FK), action, targetUserId (FK), oldValue, newValue, at.
- **ActivationToken / RefreshToken:** Token hashes, expiration, family/reuse detection.
- **Report:** id, studentId (FK), category, title, description, location, severity (`Low`, `Medium`, `High`, `Critical`), status (`Waiting`, `Accepted`, `Repair in progress`, `Waiting for supplies`, `Finished`, `Cancelled`), timestamps.
- **Job:** id, reportId (FK), janitorId (FK), estimateMinutes, startedAt, finishedAt.
- **ReportEvent:** id, reportId (FK), actorId (FK), eventType, fromStatus, toStatus, fromSeverity, toSeverity, comment, at.
- **SupplyRequest:** id, jobId (FK), janitorId (FK), item, quantity, justification, status (`Requested`, `Ordered`, `Delivered`), arrivalAt.
- **Attachment:** id, reportId (FK), url.
- **Notification:** id, userId (FK), type, payload, readAt, createdAt.

### 4.2 Authentication Module (`auth/`)
- `POST /api/v1/auth/login`: Authenticates credentials, issues short-lived JWT access token, and sets `httpOnly` refresh token cookie.
- `POST /api/v1/auth/refresh`: Rotates refresh token with reuse detection.
- `POST /api/v1/auth/logout`: Revokes refresh token session.
- `GET /api/v1/auth/me`: Returns authenticated user profile and role.
- `POST /api/v1/auth/activate`: Activates an account using a single-use activation token and sets a password.
- `POST /api/v1/auth/password-reset/request` & `confirm`: Handles password reset flow via expiring email link tokens.

### 4.3 Users Module (`users/`)
- `POST /api/v1/users`: Administrator endpoint to create a single user.
- `POST /api/v1/users/import`: Bulk CSV import of user rosters (e.g., student move-in paperwork).
- `PATCH /api/v1/users/:id`: Update role, active status, or janitor specializations with audit logging (`AuditLog`).
- `POST /api/v1/users/:id/invite`: Triggers activation link email.

### 4.4 Reports Module (`reports/`)
- `POST /api/v1/reports`: Student creates a report with initial severity and category.
- `GET /api/v1/reports`: Role-scoped report listing (students see their own reports; janitors/admins see global or filtered reports).
- `GET /api/v1/reports/:id`: Returns report details including full `ReportEvent` timeline and attachments.
- `PATCH /api/v1/reports/:id`: Student edits/cancels while `Waiting`; administrator updates severity (recording event history).
- `POST /api/v1/reports/:id/accept`: Race-safe janitor job acceptance (verifying inside a Prisma transaction that the janitor has no other active job).

### 4.5 Jobs Module (`jobs/`)
- `PATCH /api/v1/jobs/:id`: Janitor updates estimate minutes, status transitions (`Repair in progress`, `Finished`, or resuming from `Waiting for supplies` when no other job is active).
- `POST /api/v1/jobs/:id/supply-requests`: Creates a supply request, transitioning the job status to `Waiting for supplies`.
- `POST /api/v1/jobs/:id/reassign`: Administrator reassigns a janitor to a higher-severity report when no janitors are free, returning the affected job to `Waiting` and notifying affected users.

### 4.6 Supply Requests Module (`supplies/`)
- `GET /api/v1/supplies`: Janitors view their own requests; administrators view all requests.
- `PATCH /api/v1/supplies/:id`: Administrator updates status (`Ordered`, `Delivered`) and sets expected arrival time (`arrivalAt`).

### 4.7 Notifications & Real-Time Gateway (`notifications/`)
- `GET /api/v1/notifications`: Retrieve user notifications.
- `PATCH /api/v1/notifications/:id/read`: Mark notification as read.
- **WebSocket Gateway (`/ws`):** Authenticates via JWT handshake. Manages rooms for users and specialization channels (`category:plumbing`, `category:electrical`, etc.) to broadcast real-time events (`report.created`, `report.updated`, `supply.updated`, `job.reassigned`).

---

## 5. Implementation Milestones & Phases

- [x] **Phase 1: Project Setup, Prisma Schema & Authentication**
  - Initialize NestJS modules, configure global `PrismaService`, and write the complete Prisma schema (`schema.prisma`).
  - Implement Passport.js local & JWT strategies, token rotation, password hashing (Argon2id), and auth controllers/guards.

- [x] **Phase 2: User Management & RBAC**
  - Implement User service and controller for single creation, CSV bulk import, role assignment, and janitor specializations with audit logging.
  - Implement account activation and password reset email token flows.

- [ ] **Phase 3: Reports & Job Execution Workflow**
  - Implement Report creation, role-scoped querying, timeline events (`ReportEvent`), and student edit/cancel actions.
  - Implement race-safe job acceptance with the one-active-job constraint using Prisma transactions.
  - Implement job time estimation, status transitions (`Repair in progress`, `Finished`), and supply request creation.

- [ ] **Phase 4: Supply Management & Administrator Reassignment**
  - Implement administrator supply queue management (`Ordered`, `Delivered`, expected arrival time `arrivalAt`).
  - Implement administrator emergency reassignment endpoint (`POST :id/reassign`) and severity override with audit logging.

- [ ] **Phase 5: WebSocket Real-Time Gateway & Testing**
  - Implement WebSocket gateway with JWT authentication and specialization-based room routing (`report.created`, `report.updated`, `supply.updated`, `job.reassigned`).
  - Write comprehensive unit tests (`vitest`) and end-to-end integration tests (`vitest.config.e2e.ts`) verifying concurrency, access control, and state transitions.
