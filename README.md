# Student Dormitory Maintenance System

A comprehensive, role-based web application for managing maintenance reports, defects, janitorial workflows, supply procurement, and user administration in student dormitories.

---

## 🏗️ Architecture & Security

The system is fully containerized using **Docker Compose** with strict network segregation:
- **`database-net`**: Connects the PostgreSQL database and the backend API server.
- **`frontend-net`**: Connects the Angular/Nginx frontend and the backend API server.
- **Network Isolation**: The frontend container has **no direct access** to the database container; the NestJS backend acts as the secure gateway between them.
- **Port Exposure**: Only the frontend Nginx server exposes port `80` to the host. Backend and database services are completely internal.

---

## 📂 Project Structure

```text
dormitory-maintenance/
├── docker-compose.yml                  # Root Docker Compose orchestration
├── dormitory-maintenance-backend/      # NestJS backend API & Prisma ORM
│   ├── Dockerfile
│   ├── prisma/                         # Database schema and migrations
│   └── src/                            # Backend controllers, services, and modules
├── dormitory-maintenance-frontend/     # Angular SPA frontend (TailwindCSS & NgRx)
│   ├── Dockerfile
│   ├── nginx.conf                      # Nginx server & reverse proxy configuration
│   └── src/                            # Angular components, services, and guards
└── documentation/                      # System specifications and architectural docs
```

---

## 🚀 Quick Start (Docker Compose)

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### Running the Application

1. Clone the repository and navigate to the root directory:
   ```bash
   cd dormitory-maintenance
   ```

2. Build and start all services in detached mode:
   ```bash
   docker compose up --build -d
   ```

3. Access the application in your browser:
   - **Frontend App:** [http://localhost](http://localhost)

4. View logs (optional):
   ```bash
   docker compose logs -f
   ```

5. Stop the containers:
   ```bash
   docker compose down
   ```
