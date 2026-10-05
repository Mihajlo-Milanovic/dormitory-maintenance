# Student Dormitory Maintenance System — Frontend Implementation Plan

## 1. Executive Summary

This document outlines the implementation plan for the frontend application of the **Student Dormitory Maintenance System**. Built as a modern Single Page Application (SPA) using **Angular (v22+)**, **NgRx** (Store, Effects, ComponentStore, Entity), and **TailwindCSS**, the frontend provides role-based interfaces for three actor types:
1. **Students:** Create, view, edit, and track damage/defect reports with real-time status updates and timelines.
2. **Janitors:** Browse unassigned reports (filtered/highlighted by specializations), manage active jobs (one active job limit), set time estimates, request supplies, and resume paused jobs.
3. **Administrators:** Monitor global workloads, manage user accounts and janitor specializations, procure and track supply requests, handle emergency reassignments, and adjust report severity.

---

## 2. Technical Stack & Architecture

- **Framework:** Angular SPA with standalone components and reactive routing.
- **State Management:** NgRx Store & Effects, organized into domain feature slices (`auth`, `reports`, `jobs`, `supplies`, `admin`, `notifications`).
- **Styling:** TailwindCSS v4 with Material Design principles for responsive mobile and desktop usage.
- **Communication:**
  - HTTP REST API client with interceptors for JWT access token injection, CSRF/Cookie handling, and automatic refresh token rotation.
  - WebSocket client (via RxJS webSocket or socket.io-client) for real-time notifications and feed updates.
- **Routing & Guards:** Functional route guards enforcing strict Role-Based Access Control (RBAC) for Student, Janitor, and Administrator roles.

---

## 3. Project & Module Structure (`src/app/`)

```text
src/app/
├── core/
│   ├── guards/          # Role guards (student, janitor, admin), auth guard
│   ├── interceptors/    # Auth token interceptor, error interceptor, refresh interceptor
│   └── services/        # ApiService, WebSocketService, AuthService
├── state/               # Root NgRx store configuration
├── features/
│   ├── auth/            # Login, activation, password reset components & NgRx feature slice
│   ├── student/         # Report creation, report list, report detail & NgRx feature slice
│   ├── janitor/         # Open jobs feed, my jobs, job detail, supply request modal
│   ├── admin/           # Dashboard, user management, supply queue, reassignment view
│   └── notifications/   # Notification dropdown, WebSocket effect handlers
├── shared/
│   ├── components/      # Reusable UI primitives (buttons, modals, tables, badges)
│   └── models/          # TypeScript interfaces and DTOs matching backend models
├── app.config.ts        # Application providers (Router, Store, Animations, HTTP)
├── app.routes.ts        # Top-level routes with lazy loading and role guards
└── app.ts / app.html    # Root shell component (nav bar, notification center)
```

---

## 4. Feature Modules & Detailed Requirements

### 4.1 Authentication & User Management (`features/auth`)
- **Login Component:** Email/password form with validation, dispatching `AuthActions.login()`, handling rate-limiting/lockouts.
- **Activation & Password Reset:** Landing pages handling token query parameters for account activation and password recovery.
- **Auth Interceptor & Store:** Manages JWT access token in memory, refresh token cookie handling, auto-refresh on 401 errors, and `currentUser` / `role` selectors.

### 4.2 Student Module (`features/student`)
- **Report Creation Form:** Title, description, category selector (`plumbing`, `electrical`, `furniture`, `heating`, `other`), free-form location, initial severity selector (`Low`, `Medium`, `High`, `Critical`), and optional photo attachments.
- **My Reports List:** Filterable and sortable list of the student's reports showing live status (`Waiting`, `Accepted`, `Repair in progress`, `Waiting for supplies`, `Finished`, `Cancelled`).
- **Report Detail View:** Full timeline (`ReportEvent` history), assigned janitor details, time estimate once set, edit/cancel actions while in `Waiting` state.

### 4.3 Janitor Module (`features/janitor`)
- **Open Jobs Feed:** Browse all unassigned reports (`Waiting`), with automatic highlighting and top filtering for reports matching the janitor's specializations (`other` matches all). Filterable by category, severity, and location.
- **My Jobs View:** Active job tracker enforcing the "one active job at a time" rule (`Accepted` or `Repair in progress`), listing paused jobs in `Waiting for supplies` with "ready to resume" flags, and completed work history.
- **Job Detail & Management:**
  - Accept report (race-safe check against active job constraint).
  - Enter / revise time estimate (in minutes) with justification.
  - State transitions (`Repair in progress`, `Finished`).
  - Supply request creation modal (item, quantity, justification) which transitions the job to `Waiting for supplies`.

### 4.4 Administrator Module (`features/admin`)
- **Dashboard:** Overview of open reports, janitor workload, active jobs, and pending supply requests.
- **Supply Requests Queue:** Track requests (`Requested` → `Ordered` → `Delivered`), set expected arrival times (`arrivalAt`).
- **Reassignment View:** Interface triggered when a high-severity report arrives and no janitors are free. System suggests candidate janitors (lowest severity current job, least progress, matching specialization) for reassignment (`POST :id/reassign`).
- **Severity Override:** Adjust report severity after creation with audit logging.
- **User Management:** Create individual users or bulk import via CSV, assign roles, configure janitor specializations, send activation links, and manage account deactivation.

### 4.5 Notifications & Real-Time Module (`features/notifications`)
- **WebSocket Gateway Client:** Connects authenticated WebSocket, handling real-time events (`report.created`, `report.updated`, `supply.updated`, `job.reassigned`).
- **Notification Center:** Dropdown/drawer displaying unread notifications with mark-as-read actions (`PATCH :id/read`) and real-time toast alerts.

---

## 5. Implementation Milestones & Phases

- [X] **Phase 1: Foundation & Authentication**
  - [X] Set up TailwindCSS, NgRx root store, core HTTP interceptors, and JWT authentication flow.
  - [X] Implement login, session persistence, route guards, and app shell layout.

- [X] **Phase 2: Student Portal & Report Lifecycle** 
  - [X] Implement the report creation form with initial severity and file attachments.
  - [X] Build a student report list and detail a view with the event timeline.

- [X] **Phase 3: Janitor Feed & Job Execution**
  - [X] Build an open jobs feed with specialization filtering and highlighting.
  - [X] Implement job acceptance (with active job validation), time estimation, status transitions, and supply request modals.

- [X] **Phase 4: Supply Request Management & Administrator Queue**
  - [X] Implement administrator supply queue (`Ordered`, `Delivered`, expected arrival times).
  - [X] Expected arrival is written in a text field by the administrator as the supply and suppliers management is not in scope for the current version.  
  - [X] Build supply notification states and "ready to resume" flags.

- [X] **Phase 5: Reassignment, Severity & User Administration**
  - [X] Implement the administrator reassignment view with smart candidate suggestions.
  - [X] Build severity adjustment and comprehensive user management (single/CSV import, roles, specializations).

- [ ] **Phase 6: Real-Time WebSocket, Polish & Testing**
  - [ ] Integrate WebSocket effects for live notifications (`report.created`, `report.updated`, etc.).
  - [ ] Add end-to-end unit and component tests using Vitest and Angular testing utilities.

---

## 6. Testing Strategy
- **Unit Tests:** Test NgRx reducers, effects, and service API calls using Vitest.
- **Component Tests:** Verify smart/dumb component rendering, inputs/outputs, and store selectors using Angular TestBed and Vitest.
- **Accessibility & Responsiveness:** Validate mobile and desktop viewports using TailwindCSS responsive utilities.
