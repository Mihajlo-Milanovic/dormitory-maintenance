# Student Dormitory Maintenance System — Starting Specification

## 1. Purpose and Scope

A web application that lets dormitory residents report damage or defects, lets janitors pick up and carry out the repair jobs, and lets the dormitory administration control supplies, budget and staffing priorities.

**In scope:** report lifecycle, job assignment, time estimation, supply requests, reassignment, notifications. 
**Out of scope (v1):** payments, inventory of physical stock, billing students for damage, mobile native apps.

## 2. Decisions and Constraints

- D1. A student belongs to one dormitory and one room. A report is tied to the dormitory, but not necessarily to a room (it may concern a common area, e.g. corridor, bathroom, kitchen, exterior).
- D2. For now, one job is handled by one janitor at a time.
- D3. User creation and role assignment follow industry best practices (see section 3.1).
- D4. One dormitory per deployment; multi-dormitory support is a later extension. The data model should not block it (see section 9).
- D5. Notifications are in-app and real time (WebSocket); email is optional and planned for later.
- D6. Stack: Angular SPA with NgRx, NestJS backend, Passport.js with JWT for authentication.

## 3. Actors and Roles

|Role|Description|
|---|---|
|Student|Resident who reports problems and follows their progress|
|Janitor|Maintenance worker who accepts and performs jobs|
|Dormitory Administrator|Manages budget, supplies, priorities and staffing|

Role-based access control (RBAC) is enforced on every endpoint and every UI route.

### 3.1 User Provisioning and Role Assignment

- No public self-registration. Accounts are created by an administrator (single or bulk CSV import, e.g. a student roster).
- Onboarding uses a single-use, time-limited activation link; the user sets their own password. Administrators never see or set user passwords.
- Passwords are hashed with Argon2id (bcrypt as a fallback) and checked against a minimum-length and breached-password policy.
- Exactly one role per user, assigned by an administrator. Least privilege: default deny, guards on every route.
- Role changes and deactivations are audit-logged (who, when, previous/new value). Users are deactivated, never hard-deleted, so history stays intact.
- Administrator accounts are created only by an existing administrator or by a one-time bootstrap command; optional second factor for administrators.
- Password reset follows the same single-use, expiring link flow.
- Login is rate-limited with temporary lockout after repeated failures.

## 4. Functional Requirements

### 4.1 Student

|ID|Requirement|
|---|---|
|S-1|Create a report: title, description, category (plumbing, electrical, furniture, heating, other), location (dormitory area: own room, other room, common area, exterior; room number optional), optional photos, suggested severity.|
|S-2|View own reports with current status.|
|S-3|View report details including status history (timeline).|
|S-4|See the assigned janitor (name) and the estimated completion time once set.|
|S-5|Cancel or edit a report while it is still in `Waiting`.|
|S-6|Receive a notification on each status change.|

### 4.2 Janitor

| ID  | Requirement                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| J-1 | Receive a real-time alert when a new report is submitted.                                                                                          |
| J-2 | Browse the list of open (unassigned) reports, filterable by category, severity, location type and room.                                            |
| J-3 | Accept a report; it becomes assigned to that janitor and leaves the open list for others. Acceptance must be race-safe (only one janitor can win). |
| J-4 | Enter a time estimate for the job; may revise it with a reason.                                                                                    |
| J-5 | Change job status: `Repair in progress`, `Finished`.                                                                                               |
| J-6 | Create a supply request (item, quantity, justification) linked to a job when supplies are unavailable; job moves to `Waiting for supplies`.        |
| J-7 | See status of own supply requests and the expected arrival time.                                                                                   |
| J-8 | Be notified when reassigned to or from a job.                                                                                                      |

### 4.3 Dormitory Administrator

| ID  | Requirement                                                                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-1 | View all reports, jobs, janitors and their current workload.                                                                                                                            |
| A-2 | Approve or deny a supply request, with a comment; decision is informed by the displayed remaining budget.                                                                               |
| A-3 | On approval, set the expected supply arrival time.                                                                                                                                      |
| A-4 | Manage budget: set the budget for a period; approved requests deduct from it.                                                                                                           |
| A-5 | Reassign a janitor from a lower-priority job to a higher-severity one when all janitors are busy; the affected job returns to the open list (or `Waiting`) and its student is notified. |
| A-6 | Change a report's priority/severity.                                                                                                                                                    |
| A-7 | Manage users: create (single/bulk), send activation link, assign role, deactivate, reset access; all actions audit-logged (see 3.1).                                                    |

## 5. Report Lifecycle

States:

1. `Waiting` — submitted, no janitor assigned
2. `Accepted` — janitor assigned, estimate may be set
3. `Repair in progress`
4. `Waiting for supplies` — blocked on an approved/pending supply request
5. `Finished`
6. `Cancelled` (by student, before acceptance)

Transitions:

- Waiting → Accepted (janitor accepts)
- Accepted → Repair in progress (janitor starts)
- Accepted / Repair in progress → Waiting for supplies (supply request created)
- Waiting for supplies → Repair in progress (supplies arrived)
- Accepted / Repair in progress → Waiting (administrator reassigns the janitor)
- Repair in progress → Finished
- Waiting → Cancelled (student)

Every transition is recorded with actor, timestamp and optional comment.

## 6. Supply Request Lifecycle

`Pending` → `Approved` (with arrival time) → `Delivered` `Pending` → `Denied` (with comment)

If denied, the janitor is notified and the job stays blocked until the janitor submits a revised request or the administrator intervenes.

## 7. Priority and Reassignment Rules

- Severity levels: `Low`, `Medium`, `High`, `Critical` (e.g. flooding, no heating in winter, electrical hazard).
- Reassignment is only offered to the administrator when a report with higher severity than a janitor's current job is open and no janitor is free.
- The system suggests the best candidate (lowest-severity current job, least progress).

## 8. Notifications

| Event                          | Recipients                                      |
| ------------------------------ | ----------------------------------------------- |
| New report submitted           | All available janitors                          |
| Report accepted                | Student                                         |
| Status changed                 | Student                                         |
| Estimate set or revised        | Student                                         |
| Supply request created         | Administrator                                   |
| Supply request approved/denied | Requesting janitor (and student if job delayed) |
| Janitor reassigned             | Both janitors, affected student                 |

## 9. Data Model (initial)

- **User**: id, name, email, passwordHash, role, active, roomNumber (students only, nullable), activatedAt
- **AuditLog**: id, actorId, action, targetUserId, oldValue, newValue, at
- **ActivationToken**: id, userId, tokenHash, expiresAt, usedAt
- **RefreshToken**: id, userId, tokenHash, family, expiresAt, revokedAt
- **Report**: id, studentId, category, title, description, locationType (own_room | other_room | common_area | exterior), roomNumber (nullable), locationNote, severity, status, createdAt, updatedAt
- **Job**: id, reportId, janitorId, estimateMinutes, startedAt, finishedAt
- **ReportEvent**: id, reportId, actorId, fromStatus, toStatus, comment, at
- **SupplyRequest**: id, jobId, janitorId, item, quantity, justification, status, decisionBy, decisionComment, arrivalAt
- **Budget**: id, period, totalAmount, remainingAmount
- No Dormitory entity in v1 (single dormitory per deployment); a `dormitoryId` column can be added later for multi-dormitory support.
- **Attachment**: id, reportId, url
- **Notification**: id, userId, type, payload, readAt

## 10. API Outline (REST + real-time)

- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- `POST /auth/activate`, `POST /auth/password-reset/request`, `POST /auth/password-reset/confirm`
- `POST /users`, `POST /users/import`, `PATCH /users/:id` (role, active), `POST /users/:id/invite` (admin)
- `POST /reports`, `GET /reports` (scoped by role), `GET /reports/:id`, `PATCH /reports/:id`
- `POST /reports/:id/accept` (janitor)
- `PATCH /jobs/:id` (estimate, status)
- `POST /jobs/:id/supply-requests`, `GET /supply-requests`
- `POST /supply-requests/:id/approve`, `POST /supply-requests/:id/deny` (admin)
- `POST /jobs/:id/reassign` (admin)
- `GET /budget`, `PUT /budget` (admin)
- `GET /notifications`, `PATCH /notifications/:id/read`
- WebSocket channel (authenticated with the access token, role-scoped rooms): `report.created`, `report.updated`, `supply.updated`, `job.reassigned`

## 11. Non-Functional Requirements

- **Security:** short-lived JWT access token plus rotating refresh token (httpOnly, Secure, SameSite cookie), Passport.js strategies (local for login, JWT for API), NestJS role guards, students can only access their own reports, DTO validation, file upload size/type limits, CORS restricted to the SPA origin, rate limiting.
- **Real-time:** WebSocket gateway authenticates on connection and re-validates when the access token is refreshed.
- **Concurrency:** job acceptance and reassignment use transactions or optimistic locking.
- **Latency:** alerts delivered within ~2 seconds under normal load.
- **Auditability:** all state changes stored in `ReportEvent`.
- **Usability:** responsive UI, usable on phones (students and janitors report/work on the move).
- **Availability/Scale (v1):** hundreds of users, thousands of reports per year.

## 12. Screens (initial)

- Student: report form, my reports list, report detail with timeline
- Janitor: open jobs feed, my jobs, job detail (estimate, status, supply request)
- Administrator: dashboard (open reports, janitor workload, budget), supply requests queue, reassignment view, user management

## 13. Technical Architecture

- **Frontend:** Angular SPA. NgRx store with feature slices (auth, reports, jobs, supply requests, budget, notifications); effects for API calls and the WebSocket stream; selectors combine streams (e.g. reports + janitor workload for the reassignment view); route guards and an HTTP interceptor for tokens and refresh.
- **Backend:** NestJS modules per domain (auth, users, reports, jobs, supply, budget, notifications) with guards, DTO validation and a WebSocket gateway.
- **Auth:** Passport.js local and JWT strategies; refresh-token rotation with reuse detection.
- **Database:** relational (PostgreSQL suggested) for transactions on acceptance and reassignment.

## 14. Open Questions

1. Should janitors have specializations (plumber, electrician) that affect which alerts they receive?
2. Who sets initial severity: student, janitor, or administrator?
3. Can a janitor release a job they accepted? If so, under what rules?
4. Should the student be able to rate or confirm the finished repair (reopen if not fixed)?
5. What happens to a job when its supply request is denied and no alternative exists?
6. Are there working hours/shifts that should limit alerts?
7. Is the budget per period, per category, or a single pool?
8. How are student accounts created: manual, CSV roster import, or sync with a university system?
9. Which delivery channel sends activation and reset links before email is in scope (administrator copies the link, or email only for these)?
10. When a report concerns a common area, should the student pick from a predefined list of areas?

## 15. Current Milestones

1. Auth (Passport.js/JWT, refresh rotation), provisioning and activation flow, roles, user management
2. Report creation and student views
3. Janitor feed, acceptance, estimates, statuses
4. Supply requests and administrator approval with budget
5. Reassignment and priority logic
6. Real-time notifications, polish, testing