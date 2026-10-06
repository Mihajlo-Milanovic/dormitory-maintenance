# Architecture & Technical Design

## 1. Overview
The **Student Dormitory Maintenance System Frontend** is a modern Single Page Application (SPA) built with **Angular (v22+)**, **NgRx** (Store & Effects), and **TailwindCSS (v4)**. It implements role-based access control (RBAC) supporting three primary user roles: **Student**, **Janitor**, and **Administrator**.

## 2. Technology Stack
- **Framework:** Angular v22+ (Standalone components, reactive routing, modern control flow `@if` / `@for`).
- **State Management:** NgRx Store & Effects, organized into domain feature slices (`auth`, `student-report`, `janitor`, etc.).
- **Styling:** TailwindCSS v4 with Material Design UI principles.
- **Testing:** Vitest for unit and component testing (`ng test`).
- **Communication:** HTTP REST client with JWT interceptors, and WebSocket client for real-time notifications.

## 3. Application Structure (`src/app/`)

```text
src/app/
├── core/
│   ├── guards/          # Functional route guards (auth.guard.ts, role.guard.ts)
│   ├── interceptors/    # HTTP interceptors (auth.interceptor.ts, error.interceptor.ts, mock.interceptor.ts)
│   └── services/        # Core global services (ApiService, AuthService, NotificationService, WebSocketService)
├── features/
│   ├── admin/           # Admin dashboard, user management, supply queue, reassignment
│   ├── auth/            # Login component & NgRx state slice
│   ├── janitor/         # Job feed, my jobs, job detail, and NgRx state slice
│   ├── student/         # Report creation, list, detail, and NgRx state slice
│   └── notifications/   # WebSocket integration & notification center
├── shared/
│   └── models/          # TypeScript domain models (auth, user, report, supply, notification)
├── app.config.ts        # Global providers (Router, NgRx Store/Effects, HTTP client)
├── app.routes.ts        # Lazy-loaded routes with RBAC guards
└── app.ts / app.html    # Root shell component
```

## 4. Routing & Role-Based Access Control (RBAC)
Routes are defined in `app.routes.ts` with lazy loading (`loadComponent`) and protected by functional guards:
- **`AuthGuard`**: Ensures the user is authenticated before accessing protected routes.
- **`RoleGuard`**: Verifies that the authenticated user possesses the required role (`student`, `janitor`, or `admin`) to access specific feature trees.

## 5. State Management (NgRx)
NgRx is used for predictable state management across domain features:
- **Actions (`*.actions.ts`)**: Strongly typed actions created via `createActionGroup`.
- **Reducers (`*.reducer.ts`)**: Pure functions handling state transitions.
- **Selectors (`*.selectors.ts`)**: Memoized queries to extract specific slices of state.
- **Effects (`*.effects.ts`)**: Handle side effects (API calls, WebSocket events, navigation) using RxJS operators (`switchMap`, `exhaustMap`, `catchError`).
