# Core Services, Guards & Interceptors

## 1. Services (`src/app/core/services/`)

### `ApiService` (`api.service.ts`)
Provides generic HTTP methods (`get`, `post`, `put`, `patch`, `delete`) configured with base URLs and headers for communicating with the backend REST API.

### `AuthService` (`auth.service.ts`)
Manages authentication API calls (login, logout, token refresh, user profile retrieval) and token storage/persistence.

### `NotificationService` (`notification.service.ts`)
Manages user notifications, toast alerts, and display states.

### `WebSocketService` (`websocket.service.ts`)
Establishes and manages the WebSocket connection for real-time updates (`report.created`, `report.updated`, `supply.updated`, `job.reassigned`), dispatching actions or notifications as events arrive.

---

## 2. Guards (`src/app/core/guards/`)

### `AuthGuard` (`auth.guard.ts`)
Functional route guard that checks whether the user is authenticated. Redirects unauthenticated users to the login route.

### `RoleGuard` (`role.guard.ts`)
Functional route guard that checks if the authenticated user's role matches the required role(s) specified in route data (`student`, `janitor`, `admin`).

---

## 3. Interceptors (`src/app/core/interceptors/`)

### `AuthInterceptor` (`auth.interceptor.ts`)
Injects JWT access tokens into outgoing HTTP request headers (`Authorization: Bearer <token>`).

### `ErrorInterceptor` (`error.interceptor.ts`)
Catches global HTTP error responses (e.g., 401 Unauthorized, 403 Forbidden, 500 Server Error) and triggers appropriate notification alerts or token refresh flows.

### `MockInterceptor` (`mock.interceptor.ts`)
Provides local mocking capabilities for development and testing when backend services are offline.
