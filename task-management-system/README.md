# TASK MANAGEMENT SYSTEM

This repository contains a Task Management System built using an Nx monorepo architecture. It includes a backend API and a frontend dashboard within a single workspace, enabling scalable development, shared libraries, and consistent tooling.

This project is structured to reflect production-grade backend patterns including authentication, role-based access control, validation, audit logging, and automating testing.

## Currently Working:

### Workspace & Tooling
- Nx workspace set up and stable
- ESLint and Jest configuration
- Tests running reliably through Nx
- Environment configuration via .env
- Local development workflow is smooth and predictable

### Frontend
- Angular dashboard runs locally
- Tailwind CSS configuration and working
- Served and managed via Nx

Runs locally: npx nx serve dashboard
Accessible at: http://localhost:4200

### Backend

The backend is a NestJS API designed with production-stype patterns in mid

Authentication & Authorization:
- JWT-based authentication
- Role-based access control (RBAC)
- Supported roles: Views, Admin, Owner
- Guards enforced at both controller and service levels

### Task Management

- Create, list, update, and delete tasks
- Access scoped by organization
- Permissions enforced based on user role
- Viewers can only see tasks they created or are assigned to
- Admins and Owners have full task control within their organization

### Validation & DTOs
- Runtime request validation using class-validator
- Clear separation between:
    - API request DTOs (validation)
    - Domain DTOs (shared via internal libraries)
    - Database entities
- Shared types live in @org/data for consistency

### Audit Logging
- Audit logs recorded for task actions
- Includes both successful actions and permission failures
- Metadata captured for debugging and traceability

### Testing
- Unit tests written for the task services
- Repositories fully mocked
- Authorization and role logic covered

Tests run through Nx: npx nx test api --runInBand

### Database
- SQLite used for local development
- TypeORM integration
- Entities include:
    - Users
    - Organizations
    - Tasks
    - Audit Logs
- Database seeding available for development and testing

### API
- NestJS backend managed by Nx
- JWT authentication enabled

Run locally: npx nx serve api
Base URL: http://localhost:3000/api

## Tech Stack

Frontend: Angular, Tailwind CSS, TypeScript
Backend: Node.js, NestJS, TypeORM, SQLite, TypeScript
Tooling: Nx, ESLint, Jest,

## Getting Started

Prerequisites:
- Node.js 20+ recommended

Install dependencies: npm install

Run apps:
npx nx serve dashboard
npx nx serve api

Run tests:
npx nx test api --runInBand