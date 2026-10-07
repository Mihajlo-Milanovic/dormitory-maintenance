# Admin Account Creation Guide

This document outlines the step-by-step process for creating administrator accounts in the **Student Dormitory Maintenance System**. 

Due to strict security requirements and role-based access control (RBAC), **public self-registration is disabled**. Administrator accounts can be provisioned via two main methods:
1. **Initial System Bootstrap** (for setting up the very first administrator when deploying a fresh database).
2. **Administrative Provisioning** (created by an existing administrator via the User Management API or Admin Dashboard).

---

## Method 1: Initial System Bootstrap (First Administrator)

When deploying the application for the first time, no administrator accounts exist in the database. To establish root administrative access, you must create the initial administrator record directly in the database or via a startup seeder/migration script.

### Step 1: Generate an Argon2 Password Hash
Because passwords are stored securely using **Argon2**, you must generate a hashed version of your desired initial admin password before inserting the user record.

### Step 2: Insert the Administrator Record into PostgreSQL
Execute an SQL insert statement directly against the PostgreSQL database (via `psql`, Prisma Studio, or a database migration):

```sql
INSERT INTO "User" (
  id, 
  name, 
  email, 
  "passwordHash", 
  role, 
  active, 
  "createdAt", 
  "updatedAt"
)
VALUES (
  gen_random_uuid(), 
  'System Administrator', 
  'admin@dorm.com', 
  '$argon2id$v=19$m=65536,t=3,p=4$...', -- Replace with your generated Argon2 hash
  'administrator', 
  true, 
  NOW(), 
  NOW()
);
```

Once inserted, you can log into the frontend application or API using `admin@dorm.com` and your plaintext password.

---

## Method 2: Subsequent Administrator Accounts (Provisioned by an Admin)

Once at least one administrator account exists, all subsequent administrator (or janitor/student) accounts are created through the secure administrative workflow.

### Step 1: Authenticate as an Existing Administrator
Log in to obtain a valid JWT access token:

- **Endpoint:** `POST /api/v1/auth/login`
- **Request Body:**
  ```json
  {
    "email": "admin@dorm.com",
    "password": "YourSecurePassword"
  }
  ```
- **Response:** Returns an `accessToken` (Bearer token) and sets a secure httpOnly `refreshToken` cookie.

---

### Step 2: Create the Administrator User Record
Send a request to the user creation endpoint with `role` set to `administrator`.

- **Endpoint:** `POST /api/v1/users`
- **Headers:** 
  - `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`
  - `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@dorm.com",
    "role": "administrator"
  }
  ```
- **Behavior:**
  - The backend verifies that the requesting user is an `administrator`.
  - The new user record is created with `active: false` (inactive until activated).
  - An entry is recorded in the `AuditLog` table (`CREATE_USER`).

---

### Step 3: Trigger the Activation Invitation
To initiate the onboarding process, generate a secure, time-limited activation token.

- **Endpoint:** `POST /api/v1/users/{userId}/invite`
- **Headers:** 
  - `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`
- **Behavior:**
  - Generates a cryptographically secure random token (valid for 3 days).
  - Records an audit log entry (`INVITE_USER`).
  - *Note (Development/Testing):* The API response includes a `debugActivationToken` field containing the plain token string. In production, this token is typically dispatched via email.

---

### Step 4: Activate the Account and Set Password
The new administrator uses the activation token to set their own password and activate their account. **Administrators never see or set user passwords.**

- **Endpoint:** `POST /api/v1/auth/activate`
- **Request Body:**
  ```json
  {
    "token": "<activation_token_received_from_email_or_debug>",
    "password": "NewSecurePassword123!"
  }
  ```
- **Behavior:**
  - Validates the token hash and expiration.
  - Hashes the new password using Argon2 and updates the user record.
  - Marks the user account as `active: true` and invalidates the activation token.

---

## Security Audit & Compliance

Every user provisioning action—including creation, role assignment, and invitation generation—is fully tracked in the system's `AuditLog` table with actor attribution (`actorId`), timestamp, and state diffs.
