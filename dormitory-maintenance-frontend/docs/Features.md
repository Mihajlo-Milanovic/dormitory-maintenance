# Feature Modules Documentation

## 1. Authentication (`features/auth/`)
- **Login Component (`login/`)**: Email and password authentication form with validation and rate-limiting/lockout handling.
- **NgRx State (`state/`)**: Manages authentication status, JWT tokens, current user profile, and login/logout effects.

---

## 2. Student Portal (`features/student/`)
- **Report Creation (`report-create/`)**: Form for submitting damage or defect reports including title, description, category (`plumbing`, `electrical`, `furniture`, `heating`, `other`), location, initial severity (`Low`, `Medium`, `High`, `Critical`), and photo attachments.
- **Report List (`report-list/`)**: Filterable and sortable list of student reports tracking live status (`Waiting`, `Accepted`, `Repair in progress`, `Waiting for supplies`, `Finished`, `Cancelled`).
- **Report Detail (`report-detail/`)**: Comprehensive view showing the full event timeline (`ReportEvent` history), assigned janitor details, time estimates, and edit/cancel capabilities while in `Waiting` state.
- **NgRx State (`state/student-report.*`)**: Manages student report collections, creation, filtering, and detail fetching.

---

## 3. Janitor Portal (`features/janitor/`)
- **Open Jobs Feed (`janitor-feed/`)**: Browse unassigned reports (`Waiting`), automatically highlighted and filtered by the janitor's specializations (`other` matches all).
- **My Jobs (`my-jobs/`)**: Active job tracker enforcing the "one active job at a time" rule (`Accepted` or `Repair in progress`), listing paused jobs (`Waiting for supplies`) with ready-to-resume flags, and completed job history.
- **Job Detail (`job-detail/`)**:
  - Accept reports (with race-safe validation against active job constraint).
  - Enter or revise time estimates (in minutes) with justification.
  - Update job status (`Repair in progress`, `Finished`).
  - Create supply requests, transitioning jobs to `Waiting for supplies`.
- **NgRx State (`state/janitor.*`)**: Manages job feeds, active job state, supply requests, and status transition effects.

---

## 4. Administrator Portal (`features/admin/`)
- **Admin Layout (`admin-layout/`)**: Dashboard shell providing global overview of open reports, janitor workloads, and active jobs.
- **Supply Queue (`supply-queue/`)**: Tracks supply requests (`Requested` → `Ordered` → `Delivered`) and expected arrival times (`arrivalAt`).
- **Reassignment View (`reassignment/`)**: Triggered when high-severity reports arrive and no janitors are free. Suggests candidate janitors based on workload, progress, and specialization matching (`POST :id/reassign`).
- **User Management (`user-management/`)**: Create individual users, bulk import via CSV, assign roles, configure janitor specializations, send activation links, and manage account deactivation.
