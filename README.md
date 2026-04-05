# Discussion Forum System - Deployment Guide

This project has been reorganized into two main folders for easier deployment and management.

## Project Structure
- **/backend**: Java Spring Boot application (Maven)
- **/frontend**: React.js application (Vite/Tailwind)

---

## How to Run (Development)

### 1. Backend
Open a terminal in the `./backend` directory and run:
```bash
mvn spring-boot:run
```

### 2. Frontend
Open a terminal in the `./frontend` directory and run:
```bash
npm install
npm run dev
```

---

## Deployment Strategy (Non-Docker)

### Backend Build
1. Navigate to `./backend`.
2. Run `mvn clean package -DskipTests`.
3. The deployable JAR will be in `./backend/target/discussion-forum-release-0.0.1-SNAPSHOT.jar`.

### Frontend Build
1. Navigate to `./frontend`.
2. Run `npm run build`.
3. The static content will be in `./frontend/dist/`. Serve this via Nginx, Apache, or any static file server.

### Environment Configuration
Ensure the following environment variables are set on your deployment server:
- `DB_URL`: JDBC URL for your PostgreSQL instance.
- `DB_USERNAME` / `DB_PASSWORD`: Database credentials.
- `JWT_SECRET`: A secure random string for token signing.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: For image uploads.
- `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`: For seeding the first admin user.
