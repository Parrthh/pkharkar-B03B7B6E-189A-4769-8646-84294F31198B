# TASK MANAGEMENT SYSTEM

This repository contains a task management system set up using an Nx monorepo. Both the frontend dashboard and backend API live in the same workspace, making local development and future expansion easier to manage.

## Currently Working:

### Workspace & Tooling:
- Nx workspace initialized and stable
- Dependency, build, and configuration issues resolved
- ESLint and Jest configured
- Local development fully functional

### Frontend:
- Angular dashboard runs locally
- Tailwind CSS configuration and working
- Served and managed via Nx

### Backend:
- NestJS-based APi running via Nx
- SQLite database integration using TypeORM
- JWT-based authentication implemented
- Database seeding implemented for local development
- Audit logging for authentication events

## Applications

Dashboard (Frontend):
- Built with Angular
- Styled using Tailwind CSS"
- Served via Nx

Run it with: npx nx serve dashboard
Accessible at: http://localhost:4200

API (Backend):
- Node.js-based API managed by Nx

Run it with: npx nx serve api

## Tech Stack

Frontend: Angular, Tailwind CSS, TypeScript
Backend: Node.js, TypeScript
Tooling: Nx, ESLint, Jest

## Setup Instructions

Prerequisites:
- Node.js 20+ recommended

To install dependencies: npm install

Run apps:
npx nx serve dashboard
npx nx serve api